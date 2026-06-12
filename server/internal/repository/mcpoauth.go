package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/jmoiron/sqlx"

	"github.com/oli/linky/internal/model"
)

// MCPOAuthRepo persists OAuth clients, authorization codes, and refresh tokens
// used by the MCP authorization server.
type MCPOAuthRepo struct {
	db *sqlx.DB
}

func NewMCPOAuthRepo(db *sqlx.DB) *MCPOAuthRepo {
	return &MCPOAuthRepo{db: db}
}

func (r *MCPOAuthRepo) CreateClient(ctx context.Context, c *model.OAuthClient) error {
	redirectURIs, _ := json.Marshal(c.RedirectURIs)
	grantTypes, _ := json.Marshal(c.GrantTypes)
	responseTypes, _ := json.Marshal(c.ResponseTypes)

	var secret interface{}
	if c.ClientSecretHash != "" {
		secret = c.ClientSecretHash
	}

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO oauth_clients
		 (client_id, client_secret_hash, client_name, redirect_uris, grant_types, response_types, token_endpoint_auth_method, scope, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
		c.ClientID, secret, c.ClientName, redirectURIs, grantTypes, responseTypes, c.TokenEndpointAuthMethod, c.Scope)
	return err
}

func (r *MCPOAuthRepo) GetClient(ctx context.Context, clientID string) (*model.OAuthClient, error) {
	var row struct {
		ClientID                string          `db:"client_id"`
		ClientSecretHash        sql.NullString  `db:"client_secret_hash"`
		ClientName              sql.NullString  `db:"client_name"`
		RedirectURIs            json.RawMessage `db:"redirect_uris"`
		GrantTypes              json.RawMessage `db:"grant_types"`
		ResponseTypes           json.RawMessage `db:"response_types"`
		TokenEndpointAuthMethod string          `db:"token_endpoint_auth_method"`
		Scope                   sql.NullString  `db:"scope"`
	}
	err := r.db.GetContext(ctx, &row,
		`SELECT client_id, client_secret_hash, client_name, redirect_uris, grant_types, response_types, token_endpoint_auth_method, scope
		 FROM oauth_clients WHERE client_id = ?`, clientID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	c := &model.OAuthClient{
		ClientID:                row.ClientID,
		ClientSecretHash:        row.ClientSecretHash.String,
		ClientName:              row.ClientName.String,
		TokenEndpointAuthMethod: row.TokenEndpointAuthMethod,
		Scope:                   row.Scope.String,
	}
	_ = json.Unmarshal(row.RedirectURIs, &c.RedirectURIs)
	_ = json.Unmarshal(row.GrantTypes, &c.GrantTypes)
	_ = json.Unmarshal(row.ResponseTypes, &c.ResponseTypes)
	return c, nil
}

func (r *MCPOAuthRepo) CreateAuthCode(ctx context.Context, c *model.AuthCode) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO oauth_auth_codes
		 (code, client_id, user_id, redirect_uri, code_challenge, code_challenge_method, scope, resource, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		c.Code, c.ClientID, c.UserID, c.RedirectURI, c.CodeChallenge, c.CodeChallengeMethod, c.Scope, c.Resource, c.ExpiresAt)
	return err
}

// ConsumeAuthCode atomically fetches and deletes an authorization code so it
// can only be redeemed once. Returns nil if the code does not exist.
func (r *MCPOAuthRepo) ConsumeAuthCode(ctx context.Context, code string) (*model.AuthCode, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var c model.AuthCode
	err = tx.GetContext(ctx, &c,
		`SELECT code, client_id, user_id, redirect_uri, code_challenge, code_challenge_method, scope, resource, expires_at
		 FROM oauth_auth_codes WHERE code = ? FOR UPDATE`, code)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM oauth_auth_codes WHERE code = ?", code); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *MCPOAuthRepo) CreateRefreshToken(ctx context.Context, t *model.RefreshToken) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO oauth_refresh_tokens (token_hash, client_id, user_id, scope, resource, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		t.TokenHash, t.ClientID, t.UserID, t.Scope, t.Resource, t.ExpiresAt)
	return err
}

// ConsumeRefreshToken atomically fetches and deletes a refresh token to support
// rotation. Returns nil if the token does not exist.
func (r *MCPOAuthRepo) ConsumeRefreshToken(ctx context.Context, tokenHash string) (*model.RefreshToken, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var t model.RefreshToken
	err = tx.GetContext(ctx, &t,
		`SELECT token_hash, client_id, user_id, scope, resource, expires_at
		 FROM oauth_refresh_tokens WHERE token_hash = ? FOR UPDATE`, tokenHash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM oauth_refresh_tokens WHERE token_hash = ?", tokenHash); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &t, nil
}
