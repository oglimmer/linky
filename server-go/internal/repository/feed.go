package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/oli/linky/internal/model"
)

type FeedRepo struct {
	db *sqlx.DB
}

func NewFeedRepo(db *sqlx.DB) *FeedRepo {
	return &FeedRepo{db: db}
}

func (r *FeedRepo) GetByLinkID(ctx context.Context, linkID int64) (*model.FeedUpdate, error) {
	var f model.FeedUpdate
	err := r.db.GetContext(ctx, &f, "SELECT * FROM feed_updates WHERE link_id = ?", linkID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &f, err
}

func (r *FeedRepo) Upsert(ctx context.Context, f *model.FeedUpdate) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO feed_updates (link_id, user_id, seen_entries, latest_entries, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE seen_entries=VALUES(seen_entries), latest_entries=VALUES(latest_entries), updated_at=NOW()`,
		f.LinkID, f.UserID, f.SeenEntries, f.LatestEntries)
	return err
}

func (r *FeedRepo) MarkAsRead(ctx context.Context, linkID int64) error {
	// Move latest_entries into seen_entries
	var f model.FeedUpdate
	err := r.db.GetContext(ctx, &f, "SELECT * FROM feed_updates WHERE link_id = ?", linkID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}

	var seen []string
	var latest []string
	if f.SeenEntries != nil {
		json.Unmarshal(f.SeenEntries, &seen)
	}
	if f.LatestEntries != nil {
		json.Unmarshal(f.LatestEntries, &latest)
	}

	combined := append(seen, latest...)
	combinedJSON, _ := json.Marshal(combined)
	emptyJSON, _ := json.Marshal([]string{})

	_, err = r.db.ExecContext(ctx,
		"UPDATE feed_updates SET seen_entries = ?, latest_entries = ?, updated_at = NOW() WHERE link_id = ?",
		combinedJSON, emptyJSON, linkID)
	return err
}

func (r *FeedRepo) DeleteByUserID(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM feed_updates WHERE user_id = ?", userID)
	return err
}
