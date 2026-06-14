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
		"INSERT INTO users (email, password_hash, source, issuer, source_id, source_data, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
		u.Email, u.PasswordHash, u.Source, u.Issuer, u.SourceID, u.SourceData)
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

// GetBySourceID looks up a user by the (source, issuer, source_id) identity
// triple. Including the issuer ensures an account is only ever matched by the
// IdP that originally created it, so a different (or forged) IdP cannot reach an
// existing account by reusing another provider's subject value.
func (r *UserRepo) GetBySourceID(ctx context.Context, source, issuer, sourceID string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE source = ? AND issuer = ? AND source_id = ?", source, issuer, sourceID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

// BackfillOIDCIssuer stamps the given issuer onto legacy OIDC users that predate
// the issuer column (issuer = ''). This is safe because every such row was
// created by the single configured OIDC provider. It is idempotent: once
// backfilled, subsequent calls match no rows. Returns the number of rows updated.
func (r *UserRepo) BackfillOIDCIssuer(ctx context.Context, issuer string) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		"UPDATE users SET issuer = ? WHERE source = 'oidc' AND issuer = ''", issuer)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *UserRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM users WHERE id = ?", id)
	return err
}
