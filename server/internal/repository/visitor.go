package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/oli/linky/internal/model"
)

type VisitorRepo struct {
	db *sqlx.DB
}

func NewVisitorRepo(db *sqlx.DB) *VisitorRepo {
	return &VisitorRepo{db: db}
}

func (r *VisitorRepo) Upsert(ctx context.Context, v *model.Visitor) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO visitors (visitor_id, auth_type, hint, refresh_token, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE auth_type=VALUES(auth_type), hint=VALUES(hint), refresh_token=VALUES(refresh_token)`,
		v.VisitorID, v.AuthType, v.Hint, v.RefreshToken)
	return err
}

func (r *VisitorRepo) GetByVisitorID(ctx context.Context, visitorID string) (*model.Visitor, error) {
	var v model.Visitor
	err := r.db.GetContext(ctx, &v, "SELECT * FROM visitors WHERE visitor_id = ?", visitorID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &v, err
}
