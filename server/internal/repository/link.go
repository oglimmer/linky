package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/oli/linky/internal/model"
)

type LinkRepo struct {
	db *sqlx.DB
}

func NewLinkRepo(db *sqlx.DB) *LinkRepo {
	return &LinkRepo{db: db}
}

func (r *LinkRepo) Create(ctx context.Context, l *model.Link) (int64, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx,
		`INSERT INTO links (user_id, url, rss_url, page_title, notes, favicon_url, call_counter, last_called_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
		l.UserID, l.URL, l.RssURL, l.PageTitle, l.Notes, l.FaviconURL, l.CallCounter, l.LastCalledAt)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	if err := insertTags(ctx, tx, id, l.Tags); err != nil {
		return 0, err
	}

	return id, tx.Commit()
}

func (r *LinkRepo) Update(ctx context.Context, l *model.Link) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx,
		`UPDATE links SET url=?, rss_url=?, page_title=?, notes=?, favicon_url=?, call_counter=?, last_called_at=?
         WHERE id=? AND user_id=?`,
		l.URL, l.RssURL, l.PageTitle, l.Notes, l.FaviconURL, l.CallCounter, l.LastCalledAt, l.ID, l.UserID)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, "DELETE FROM link_tags WHERE link_id = ?", l.ID)
	if err != nil {
		return err
	}

	if err := insertTags(ctx, tx, l.ID, l.Tags); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *LinkRepo) GetByID(ctx context.Context, id, userID int64) (*model.Link, error) {
	var l model.Link
	err := r.db.GetContext(ctx, &l, "SELECT * FROM links WHERE id = ? AND user_id = ?", id, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	tags, err := r.getTagsForLink(ctx, id)
	if err != nil {
		return nil, err
	}
	l.Tags = tags
	return &l, nil
}

func (r *LinkRepo) ListByUserAndTag(ctx context.Context, userID int64, tag string) ([]model.Link, error) {
	var links []model.Link
	var err error

	if tag == "all" {
		err = r.db.SelectContext(ctx, &links,
			"SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC", userID)
	} else {
		err = r.db.SelectContext(ctx, &links,
			`SELECT l.* FROM links l
             JOIN link_tags lt ON l.id = lt.link_id
             WHERE l.user_id = ? AND lt.tag = ?
             ORDER BY l.created_at DESC`, userID, tag)
	}
	if err != nil {
		return nil, err
	}

	return r.loadTagsForLinks(ctx, links)
}

func (r *LinkRepo) ListByUserAndURL(ctx context.Context, userID int64, normalizedURL string) ([]model.Link, error) {
	var links []model.Link
	// Match URLs ignoring protocol and trailing slash
	err := r.db.SelectContext(ctx, &links,
		`SELECT * FROM links WHERE user_id = ? AND
         REPLACE(REPLACE(REPLACE(url, 'https://', ''), 'http://', ''), '/', '') = ?`,
		userID, normalizedURL)
	if err != nil {
		return nil, err
	}
	return r.loadTagsForLinks(ctx, links)
}

func (r *LinkRepo) Delete(ctx context.Context, id, userID int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM links WHERE id = ? AND user_id = ?", id, userID)
	return err
}

func (r *LinkRepo) Search(ctx context.Context, userID int64, query string) ([]model.Link, error) {
	var links []model.Link
	err := r.db.SelectContext(ctx, &links,
		`SELECT * FROM links WHERE user_id = ? AND MATCH(url, page_title, notes) AGAINST(? IN BOOLEAN MODE)
         ORDER BY created_at DESC`, userID, query)
	if err != nil {
		return nil, err
	}
	return r.loadTagsForLinks(ctx, links)
}

func (r *LinkRepo) SearchByTag(ctx context.Context, userID int64, tag string) ([]model.Link, error) {
	var links []model.Link
	err := r.db.SelectContext(ctx, &links,
		`SELECT l.* FROM links l
         JOIN link_tags lt ON l.id = lt.link_id
         WHERE l.user_id = ? AND lt.tag LIKE ?
         ORDER BY l.created_at DESC`, userID, "%"+tag+"%")
	if err != nil {
		return nil, err
	}
	return r.loadTagsForLinks(ctx, links)
}

func (r *LinkRepo) RenameTag(ctx context.Context, userID int64, oldTag, newTag string) (int64, error) {
	// Get all link IDs for this user that have the old tag
	res, err := r.db.ExecContext(ctx,
		`UPDATE link_tags lt
         JOIN links l ON lt.link_id = l.id
         SET lt.tag = ?
         WHERE l.user_id = ? AND lt.tag = ?
         AND lt.link_id NOT IN (
             SELECT link_id FROM (SELECT link_id FROM link_tags WHERE tag = ?) AS existing
         )`, newTag, userID, oldTag)
	if err != nil {
		return 0, err
	}
	count, _ := res.RowsAffected()

	// Delete remaining old tags (where new tag already existed on the link)
	_, err = r.db.ExecContext(ctx,
		`DELETE lt FROM link_tags lt
         JOIN links l ON lt.link_id = l.id
         WHERE l.user_id = ? AND lt.tag = ?`, userID, oldTag)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *LinkRepo) IncrementCallCounter(ctx context.Context, id, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE links SET call_counter = call_counter + 1, last_called_at = NOW() WHERE id = ? AND user_id = ?",
		id, userID)
	return err
}

func (r *LinkRepo) GetTagCounts(ctx context.Context, userID int64) (map[string]int, error) {
	type tagCount struct {
		Tag   string `db:"tag"`
		Count int    `db:"count"`
	}
	var counts []tagCount
	err := r.db.SelectContext(ctx, &counts,
		`SELECT lt.tag, COUNT(*) as count FROM link_tags lt
         JOIN links l ON lt.link_id = l.id
         WHERE l.user_id = ?
         GROUP BY lt.tag`, userID)
	if err != nil {
		return nil, err
	}
	result := make(map[string]int, len(counts))
	for _, c := range counts {
		result[c.Tag] = c.Count
	}
	return result, nil
}

func (r *LinkRepo) getTagsForLink(ctx context.Context, linkID int64) ([]string, error) {
	var tags []string
	err := r.db.SelectContext(ctx, &tags, "SELECT tag FROM link_tags WHERE link_id = ?", linkID)
	return tags, err
}

func (r *LinkRepo) loadTagsForLinks(ctx context.Context, links []model.Link) ([]model.Link, error) {
	if len(links) == 0 {
		return links, nil
	}

	ids := make([]int64, len(links))
	idMap := make(map[int64]int, len(links))
	for i, l := range links {
		ids[i] = l.ID
		idMap[l.ID] = i
		links[i].Tags = []string{} // initialize empty
	}

	query, args, err := sqlx.In("SELECT link_id, tag FROM link_tags WHERE link_id IN (?)", ids)
	if err != nil {
		return nil, err
	}
	query = r.db.Rebind(query)

	type linkTag struct {
		LinkID int64  `db:"link_id"`
		Tag    string `db:"tag"`
	}
	var tagRows []linkTag
	if err := r.db.SelectContext(ctx, &tagRows, query, args...); err != nil {
		return nil, err
	}

	for _, lt := range tagRows {
		if idx, ok := idMap[lt.LinkID]; ok {
			links[idx].Tags = append(links[idx].Tags, lt.Tag)
		}
	}

	return links, nil
}

func insertTags(ctx context.Context, tx *sqlx.Tx, linkID int64, tags []string) error {
	if len(tags) == 0 {
		return nil
	}
	valueStrings := make([]string, len(tags))
	valueArgs := make([]interface{}, 0, len(tags)*2)
	for i, tag := range tags {
		valueStrings[i] = "(?, ?)"
		valueArgs = append(valueArgs, linkID, tag)
	}
	query := fmt.Sprintf("INSERT INTO link_tags (link_id, tag) VALUES %s", strings.Join(valueStrings, ","))
	_, err := tx.ExecContext(ctx, query, valueArgs...)
	return err
}
