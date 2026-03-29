package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/oli/linky/internal/model"
)

type TagRepo struct {
	db *sqlx.DB
}

func NewTagRepo(db *sqlx.DB) *TagRepo {
	return &TagRepo{db: db}
}

func (r *TagRepo) GetHierarchy(ctx context.Context, userID int64) ([]model.TagNode, error) {
	var nodes []model.TagNode
	err := r.db.SelectContext(ctx, &nodes,
		"SELECT * FROM tag_hierarchy WHERE user_id = ? ORDER BY sort_idx", userID)
	if err != nil {
		return nil, err
	}
	return nodes, nil
}

func (r *TagRepo) SaveHierarchy(ctx context.Context, userID int64, nodes []model.TagNode) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, "DELETE FROM tag_hierarchy WHERE user_id = ?", userID)
	if err != nil {
		return err
	}

	for _, n := range nodes {
		_, err = tx.ExecContext(ctx,
			"INSERT INTO tag_hierarchy (user_id, tag_name, parent, sort_idx) VALUES (?, ?, ?, ?)",
			userID, n.Name, n.Parent, n.Index)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *TagRepo) DeleteTag(ctx context.Context, userID int64, tagName string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Remove from hierarchy
	_, err = tx.ExecContext(ctx,
		"DELETE FROM tag_hierarchy WHERE user_id = ? AND tag_name = ?", userID, tagName)
	if err != nil {
		return err
	}

	// Remove from all links of this user
	_, err = tx.ExecContext(ctx,
		`DELETE lt FROM link_tags lt
         JOIN links l ON lt.link_id = l.id
         WHERE l.user_id = ? AND lt.tag = ?`, userID, tagName)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *TagRepo) RenameInHierarchy(ctx context.Context, userID int64, oldName, newName string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Rename the tag itself
	_, err = tx.ExecContext(ctx,
		"UPDATE tag_hierarchy SET tag_name = ? WHERE user_id = ? AND tag_name = ?",
		newName, userID, oldName)
	if err != nil {
		return err
	}

	// Update parent references
	_, err = tx.ExecContext(ctx,
		"UPDATE tag_hierarchy SET parent = ? WHERE user_id = ? AND parent = ?",
		newName, userID, oldName)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *TagRepo) HasChildren(ctx context.Context, userID int64, tagName string) (bool, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		"SELECT COUNT(*) FROM tag_hierarchy WHERE user_id = ? AND parent = ?", userID, tagName)
	return count > 0, err
}
