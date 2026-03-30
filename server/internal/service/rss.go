package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"github.com/mmcdole/gofeed"

	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/repository"
)

var ErrFeedUnavailable = errors.New("feed unavailable")

type RssService struct {
	feedRepo *repository.FeedRepo
	linkRepo *repository.LinkRepo
}

func NewRssService(feedRepo *repository.FeedRepo, linkRepo *repository.LinkRepo) *RssService {
	return &RssService{feedRepo: feedRepo, linkRepo: linkRepo}
}

func (s *RssService) GetUpdateCount(ctx context.Context, userID, linkID int64) (int, error) {
	link, err := s.linkRepo.GetByID(ctx, linkID, userID)
	if err != nil || link == nil {
		return 0, fmt.Errorf("link not found")
	}
	if link.RssURL == nil || *link.RssURL == "" {
		return 0, nil
	}

	newEntries, _, err := s.fetchAndDiff(ctx, linkID, userID, *link.RssURL)
	if err != nil {
		return 0, err
	}
	return len(newEntries), nil
}

func (s *RssService) GetUpdateDetails(ctx context.Context, userID, linkID int64) (*model.RssDetailsResponse, error) {
	link, err := s.linkRepo.GetByID(ctx, linkID, userID)
	if err != nil || link == nil {
		return nil, fmt.Errorf("link not found")
	}
	if link.RssURL == nil || *link.RssURL == "" {
		return &model.RssDetailsResponse{Result: 0, Display: []model.RssItem{}}, nil
	}

	newEntries, items, err := s.fetchAndDiff(ctx, linkID, userID, *link.RssURL)
	if err != nil {
		return nil, err
	}

	return &model.RssDetailsResponse{
		Result:  len(newEntries),
		Display: items,
	}, nil
}

func (s *RssService) MarkAsRead(ctx context.Context, linkID int64) error {
	return s.feedRepo.MarkAsRead(ctx, linkID)
}

func (s *RssService) fetchAndDiff(ctx context.Context, linkID, userID int64, rssURL string) ([]string, []model.RssItem, error) {
	slog.Info("fetching RSS feed", "link_id", linkID, "url", rssURL)
	fp := gofeed.NewParser()
	feed, err := fp.ParseURL(rssURL)
	if err != nil {
		slog.Error("failed to fetch RSS feed", "link_id", linkID, "url", rssURL, "error", err)
		return nil, nil, fmt.Errorf("%w: %w", ErrFeedUnavailable, err)
	}
	slog.Info("RSS feed fetched", "link_id", linkID, "url", rssURL, "items", len(feed.Items))

	// Get all entry IDs from the feed
	var currentIDs []string
	var items []model.RssItem
	for _, item := range feed.Items {
		id := item.GUID
		if id == "" {
			id = item.Link
		}
		currentIDs = append(currentIDs, id)
		items = append(items, model.RssItem{
			Link:  item.Link,
			Title: item.Title,
		})
	}

	// Load existing feed state
	existing, err := s.feedRepo.GetByLinkID(ctx, linkID)
	if err != nil {
		slog.Error("failed to load feed state", "link_id", linkID, "error", err)
		return nil, nil, err
	}

	var seenIDs []string
	if existing != nil && existing.SeenEntries != nil {
		json.Unmarshal(existing.SeenEntries, &seenIDs)
	}

	// Find new entries
	seenSet := make(map[string]bool, len(seenIDs))
	for _, id := range seenIDs {
		seenSet[id] = true
	}

	var newIDs []string
	var newItems []model.RssItem
	for i, id := range currentIDs {
		if !seenSet[id] {
			newIDs = append(newIDs, id)
			if i < len(items) {
				newItems = append(newItems, items[i])
			}
		}
	}

	// Save updated state
	seenJSON, _ := json.Marshal(seenIDs)
	latestJSON, _ := json.Marshal(newIDs)

	fu := &model.FeedUpdate{
		LinkID:        linkID,
		UserID:        userID,
		SeenEntries:   seenJSON,
		LatestEntries: latestJSON,
	}
	s.feedRepo.Upsert(ctx, fu)

	if newItems == nil {
		newItems = []model.RssItem{}
	}
	return newIDs, newItems, nil
}
