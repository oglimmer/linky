package service

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"math/big"
	"mime/multipart"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/oli/linky/internal/config"
)

type ContentService struct {
	cfg *config.Config
}

func NewContentService(cfg *config.Config) *ContentService {
	return &ContentService{cfg: cfg}
}

// Upload sends HTML to the content backend and returns the public archive URL.
func (s *ContentService) Upload(htmlContent, originalURL, title, creator string) (string, error) {
	slug := generateSlug(originalURL)

	params := url.Values{"slug": {slug}}
	if title != "" {
		params.Set("title", title)
	}
	if originalURL != "" {
		params.Set("sourceUrl", originalURL)
	}
	if creator != "" {
		params.Set("creator", creator)
	}

	uploadURL := fmt.Sprintf("%s/api/content?%s", s.cfg.ContentAPIURL, params.Encode())

	// Build multipart form
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", slug+".html")
	if err != nil {
		return "", fmt.Errorf("creating form file: %w", err)
	}
	if _, err := io.WriteString(part, htmlContent); err != nil {
		return "", fmt.Errorf("writing html: %w", err)
	}
	writer.Close()

	req, err := http.NewRequest("POST", uploadURL, &body)
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString(
		[]byte(s.cfg.ContentAPIUser+":"+s.cfg.ContentAPIPass),
	))

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("uploading to content backend: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("content backend returned %d: %s", resp.StatusCode, string(respBody))
	}

	return fmt.Sprintf("%s/s/%s", s.cfg.ContentAPIURL, slug), nil
}

var slugCleanRegex = regexp.MustCompile(`[^a-z0-9]+`)

func generateSlug(rawURL string) string {
	slug := strings.TrimPrefix(rawURL, "https://")
	slug = strings.TrimPrefix(slug, "http://")
	slug = strings.TrimPrefix(slug, "www.")
	slug = strings.ToLower(slug)
	slug = slugCleanRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if len(slug) > 50 {
		slug = slug[:50]
	}
	slug = strings.Trim(slug, "-")

	hash := shortHash(rawURL)
	if slug != "" {
		slug = slug + "-" + hash
	} else {
		slug = "page-" + hash
	}
	if len(slug) < 2 {
		slug = "page-" + hash
	}
	return slug
}

func shortHash(s string) string {
	h := sha256.Sum256([]byte(s))
	n := new(big.Int).SetBytes(h[:8])
	return n.Text(36)[:6]
}
