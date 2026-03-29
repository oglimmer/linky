package model

import "time"

type Link struct {
	ID           int64      `db:"id" json:"id"`
	UserID       int64      `db:"user_id" json:"-"`
	URL          string     `db:"url" json:"linkUrl"`
	RssURL       *string    `db:"rss_url" json:"rssUrl,omitempty"`
	PageTitle    *string    `db:"page_title" json:"pageTitle,omitempty"`
	Notes        *string    `db:"notes" json:"notes,omitempty"`
	FaviconURL   *string    `db:"favicon_url" json:"faviconUrl,omitempty"`
	CallCounter  int        `db:"call_counter" json:"callCounter"`
	LastCalledAt *time.Time `db:"last_called_at" json:"lastCalled,omitempty"`
	CreatedAt    time.Time  `db:"created_at" json:"createdDate"`
	Tags         []string   `db:"-" json:"tags"`
}

// LinkPayload is the request body for creating/updating links.
type LinkPayload struct {
	URL       string  `json:"url"`
	Tags      string  `json:"tags"` // space-separated
	RssURL    *string `json:"rssUrl"`
	PageTitle *string `json:"pageTitle"`
	Notes     *string `json:"notes"`
}

// LinkMutationResponse is the response for create/update operations.
type LinkMutationResponse struct {
	Primary    Link   `json:"primary"`
	Collateral []Link `json:"collateral"`
}

// TagRenamePayload for PATCH /rest/links/tags.
type TagRenamePayload struct {
	OldTagName string `json:"oldTagName"`
	NewTagName string `json:"newTagName"`
}
