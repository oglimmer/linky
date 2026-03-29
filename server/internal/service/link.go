package service

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"golang.org/x/net/html"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/repository"
)

var dateTagRegex = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// System/readonly tags that cannot be manually added or renamed
var readonlyTags = map[string]bool{
	"all": true, "untagged": true, "rss": true,
	"duedate": true, "locked": true, "archive": true,
}

type LinkService struct {
	repo    *repository.LinkRepo
	tagRepo *repository.TagRepo
	cfg     *config.Config
}

func NewLinkService(repo *repository.LinkRepo, tagRepo *repository.TagRepo, cfg *config.Config) *LinkService {
	return &LinkService{repo: repo, tagRepo: tagRepo, cfg: cfg}
}

func (s *LinkService) Create(ctx context.Context, userID int64, payload model.LinkPayload) (*model.LinkMutationResponse, error) {
	tags := parseTags(payload.Tags)

	resolvedURL := payload.URL
	pageTitle := ""
	faviconURL := ""
	isLocked := contains(tags, "locked")

	if !isLocked {
		resolved, title, favicon := s.resolveLink(payload.URL)
		resolvedURL = resolved
		pageTitle = title
		faviconURL = favicon
	}

	// Override with user-supplied title if present
	if payload.PageTitle != nil && *payload.PageTitle != "" {
		pageTitle = *payload.PageTitle
	}

	// Apply system tags
	tags = applySystemTags(tags, payload.RssURL)

	link := &model.Link{
		UserID:      userID,
		URL:         resolvedURL,
		RssURL:      payload.RssURL,
		PageTitle:   strPtr(pageTitle),
		Notes:       payload.Notes,
		FaviconURL:  strPtr(faviconURL),
		CallCounter: 0,
		Tags:        tags,
	}

	id, err := s.repo.Create(ctx, link)
	if err != nil {
		return nil, fmt.Errorf("creating link: %w", err)
	}

	link.ID = id
	link.CreatedAt = time.Now()

	// Find duplicates
	normalizedURL := normalizeURL(resolvedURL)
	collateral, _ := s.repo.ListByUserAndURL(ctx, userID, normalizedURL)
	// Filter out the new link itself
	var dupes []model.Link
	for _, l := range collateral {
		if l.ID != id {
			dupes = append(dupes, l)
		}
	}
	if dupes == nil {
		dupes = []model.Link{}
	}

	// Update tag hierarchy to include any new tags
	s.ensureTagsInHierarchy(ctx, userID, tags)

	return &model.LinkMutationResponse{
		Primary:    *link,
		Collateral: dupes,
	}, nil
}

func (s *LinkService) Update(ctx context.Context, userID, linkID int64, payload model.LinkPayload) (*model.LinkMutationResponse, error) {
	existing, err := s.repo.GetByID(ctx, linkID, userID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fmt.Errorf("link not found")
	}

	tags := parseTags(payload.Tags)
	tags = applySystemTags(tags, payload.RssURL)

	existing.URL = payload.URL
	existing.RssURL = payload.RssURL
	existing.PageTitle = payload.PageTitle
	existing.Notes = payload.Notes
	existing.Tags = tags

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	// Find duplicates
	normalizedURL := normalizeURL(existing.URL)
	collateral, _ := s.repo.ListByUserAndURL(ctx, userID, normalizedURL)
	var dupes []model.Link
	for _, l := range collateral {
		if l.ID != linkID {
			dupes = append(dupes, l)
		}
	}
	if dupes == nil {
		dupes = []model.Link{}
	}

	s.ensureTagsInHierarchy(ctx, userID, tags)

	return &model.LinkMutationResponse{
		Primary:    *existing,
		Collateral: dupes,
	}, nil
}

func (s *LinkService) GetByTag(ctx context.Context, userID int64, tag string) ([]model.Link, error) {
	return s.repo.ListByUserAndTag(ctx, userID, tag)
}

func (s *LinkService) Delete(ctx context.Context, userID, linkID int64) error {
	return s.repo.Delete(ctx, linkID, userID)
}

func (s *LinkService) Search(ctx context.Context, userID int64, query string) ([]model.Link, error) {
	// Parse field-specific search: tags:foo, url:bar, title:baz, notes:qux
	if strings.HasPrefix(query, "tags:") {
		return s.repo.SearchByTag(ctx, userID, strings.TrimPrefix(query, "tags:"))
	}
	return s.repo.Search(ctx, userID, query)
}

func (s *LinkService) IncrementCallCounter(ctx context.Context, userID, linkID int64) error {
	return s.repo.IncrementCallCounter(ctx, linkID, userID)
}

func (s *LinkService) GetByID(ctx context.Context, userID, linkID int64) (*model.Link, error) {
	return s.repo.GetByID(ctx, linkID, userID)
}

func (s *LinkService) RenameTag(ctx context.Context, userID int64, oldTag, newTag string) (int64, error) {
	if readonlyTags[oldTag] || readonlyTags[newTag] {
		return 0, fmt.Errorf("cannot rename system tags")
	}

	count, err := s.repo.RenameTag(ctx, userID, oldTag, newTag)
	if err != nil {
		return 0, err
	}

	// Update hierarchy
	if err := s.tagRepo.RenameInHierarchy(ctx, userID, oldTag, newTag); err != nil {
		return 0, err
	}

	return count, nil
}

func (s *LinkService) GetFavicon(ctx context.Context, userID, linkID int64) (string, error) {
	link, err := s.repo.GetByID(ctx, linkID, userID)
	if err != nil || link == nil {
		return "", fmt.Errorf("link not found")
	}
	if link.FaviconURL != nil {
		return *link.FaviconURL, nil
	}
	return "", fmt.Errorf("no favicon")
}

// resolveLink follows redirects, extracts page title and favicon
func (s *LinkService) resolveLink(rawURL string) (resolvedURL, title, favicon string) {
	resolvedURL = rawURL

	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	req, err := http.NewRequest("GET", rawURL, nil)
	if err != nil {
		return rawURL, "", ""
	}
	req.Header.Set("User-Agent", s.cfg.UserAgent)

	resp, err := client.Do(req)
	if err != nil {
		slog.Warn("failed to resolve URL", "url", rawURL, "error", err)
		return rawURL, "", ""
	}
	defer resp.Body.Close()

	resolvedURL = resp.Request.URL.String()

	// Read first 1MB max for title extraction
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return resolvedURL, "", ""
	}

	title = extractTitle(string(body))

	// Build favicon URL
	parsedURL, err := url.Parse(resolvedURL)
	if err == nil {
		favicon = fmt.Sprintf("%s://%s/favicon.ico", parsedURL.Scheme, parsedURL.Host)
	}

	return resolvedURL, title, favicon
}

func extractTitle(htmlStr string) string {
	tokenizer := html.NewTokenizer(strings.NewReader(htmlStr))
	for {
		tt := tokenizer.Next()
		if tt == html.ErrorToken {
			return ""
		}
		if tt == html.StartTagToken {
			t := tokenizer.Token()
			if t.Data == "title" {
				tokenizer.Next()
				return strings.TrimSpace(tokenizer.Token().Data)
			}
		}
	}
}

func (s *LinkService) ensureTagsInHierarchy(ctx context.Context, userID int64, tags []string) {
	hierarchy, err := s.tagRepo.GetHierarchy(ctx, userID)
	if err != nil {
		return
	}

	existingTags := make(map[string]bool)
	for _, n := range hierarchy {
		existingTags[n.Name] = true
	}

	maxIdx := len(hierarchy)
	changed := false
	for _, tag := range tags {
		if readonlyTags[tag] || existingTags[tag] {
			continue
		}
		hierarchy = append(hierarchy, model.TagNode{
			Name:   tag,
			Parent: "root",
			Index:  maxIdx,
		})
		maxIdx++
		changed = true
	}

	if changed {
		s.tagRepo.SaveHierarchy(ctx, userID, hierarchy)
	}
}

func parseTags(tagStr string) []string {
	if tagStr == "" {
		return nil
	}
	parts := strings.Fields(strings.ToLower(tagStr))
	seen := make(map[string]bool)
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" && !seen[p] {
			seen[p] = true
			result = append(result, p)
		}
	}
	return result
}

func applySystemTags(tags []string, rssURL *string) []string {
	tagSet := make(map[string]bool)
	for _, t := range tags {
		tagSet[t] = true
	}

	// Always add "all"
	tagSet["all"] = true

	// Add "untagged" if no user tags (only system tags)
	userTags := 0
	for t := range tagSet {
		if !readonlyTags[t] {
			userTags++
		}
	}
	if userTags == 0 {
		tagSet["untagged"] = true
	} else {
		delete(tagSet, "untagged")
	}

	// Add "rss" if RSS URL present
	if rssURL != nil && *rssURL != "" {
		tagSet["rss"] = true
	}

	// Add "duedate" if any tag matches date format
	for t := range tagSet {
		if dateTagRegex.MatchString(t) {
			tagSet["duedate"] = true
			break
		}
	}

	result := make([]string, 0, len(tagSet))
	for t := range tagSet {
		result = append(result, t)
	}
	return result
}

func normalizeURL(u string) string {
	u = strings.TrimPrefix(u, "https://")
	u = strings.TrimPrefix(u, "http://")
	u = strings.TrimRight(u, "/")
	return u
}

func contains(ss []string, s string) bool {
	for _, v := range ss {
		if v == s {
			return true
		}
	}
	return false
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
