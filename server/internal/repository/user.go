package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/oli/linky/internal/model"
)

type UserRepo struct {
	db *sqlx.DB
}

func NewUserRepo(db *sqlx.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, u *model.User) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		"INSERT INTO users (email, password_hash, source, source_id, source_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
		u.Email, u.PasswordHash, u.Source, u.SourceID, u.SourceData)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *UserRepo) GetByID(ctx context.Context, id int64) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE id = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE LOWER(email) = LOWER(?)", email)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *UserRepo) GetBySourceID(ctx context.Context, source, sourceID string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE source = ? AND source_id = ?", source, sourceID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *UserRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM users WHERE id = ?", id)
	return err
}
