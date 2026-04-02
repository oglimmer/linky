package model

import (
	"encoding/json"
	"time"
)

type FeedUpdate struct {
	ID            int64           `db:"id"`
	LinkID        int64           `db:"link_id"`
	UserID        int64           `db:"user_id"`
	SeenEntries   json.RawMessage `db:"seen_entries"`
	LatestEntries json.RawMessage `db:"latest_entries"`
	CreatedAt     time.Time       `db:"created_at"`
	UpdatedAt     time.Time       `db:"updated_at"`
}

type RssCountResponse struct {
	Result int `json:"result"`
}

type RssItem struct {
	Link        string `json:"link"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

type RssDetailsResponse struct {
	Result  int       `json:"result"`
	Display []RssItem `json:"display"`
}
