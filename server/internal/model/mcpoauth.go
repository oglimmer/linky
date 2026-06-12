package model

import "time"

// OAuthClient is a client dynamically registered via RFC 7591 to access the
// MCP endpoint. Public clients (token_endpoint_auth_method == "none") have an
// empty ClientSecretHash and authenticate with PKCE only.
type OAuthClient struct {
	ClientID                string
	ClientSecretHash        string
	ClientName              string
	RedirectURIs            []string
	GrantTypes              []string
	ResponseTypes           []string
	TokenEndpointAuthMethod string
	Scope                   string
	CreatedAt               time.Time
}

// IsPublic reports whether the client authenticates without a secret.
func (c *OAuthClient) IsPublic() bool {
	return c.TokenEndpointAuthMethod == "none" || c.ClientSecretHash == ""
}

// AllowsRedirectURI reports whether uri exactly matches one of the client's
// registered redirect URIs.
func (c *OAuthClient) AllowsRedirectURI(uri string) bool {
	for _, u := range c.RedirectURIs {
		if u == uri {
			return true
		}
	}
	return false
}

// AuthCode is a one-time authorization code issued by the authorize endpoint
// and redeemed at the token endpoint. It binds the code to a user, a client,
// the PKCE challenge, and the requested resource (RFC 8707).
type AuthCode struct {
	Code                string    `db:"code"`
	ClientID            string    `db:"client_id"`
	UserID              int64     `db:"user_id"`
	RedirectURI         string    `db:"redirect_uri"`
	CodeChallenge       string    `db:"code_challenge"`
	CodeChallengeMethod string    `db:"code_challenge_method"`
	Scope               string    `db:"scope"`
	Resource            string    `db:"resource"`
	ExpiresAt           time.Time `db:"expires_at"`
}

// RefreshToken is a stored (hashed) refresh token enabling long-lived MCP
// sessions via the refresh_token grant.
type RefreshToken struct {
	TokenHash string    `db:"token_hash"`
	ClientID  string    `db:"client_id"`
	UserID    int64     `db:"user_id"`
	Scope     string    `db:"scope"`
	Resource  string    `db:"resource"`
	ExpiresAt time.Time `db:"expires_at"`
}
