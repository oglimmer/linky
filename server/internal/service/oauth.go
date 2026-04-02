package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"

	"github.com/oli/linky/internal/config"
)

// OAuthService manages the OIDC provider configuration and authorization flow.
type OAuthService struct {
	cfg                *config.Config
	provider           *oidc.Provider
	verifier           *oidc.IDTokenVerifier
	oauth2             *oauth2.Config
	endSessionEndpoint string
}

// NewOAuthService initialises an OAuthService using OIDC discovery.
func NewOAuthService(cfg *config.Config) *OAuthService {
	s := &OAuthService{cfg: cfg}
	if cfg.OIDCIssuerURL != "" {
		provider, err := oidc.NewProvider(context.Background(), cfg.OIDCIssuerURL)
		if err != nil {
			panic(fmt.Sprintf("failed OIDC discovery for %s: %v", cfg.OIDCIssuerURL, err))
		}
		s.provider = provider
		s.verifier = provider.Verifier(&oidc.Config{ClientID: cfg.OIDCClientID})
		s.oauth2 = &oauth2.Config{
			ClientID:     cfg.OIDCClientID,
			ClientSecret: cfg.OIDCClientSecret,
			RedirectURL:  cfg.OAuthRedirectBase + "/oidc",
			Endpoint:     provider.Endpoint(),
			Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
		}

		// Extract end_session_endpoint from discovery document.
		var discoveryClaims struct {
			EndSessionEndpoint string `json:"end_session_endpoint"`
		}
		if err := provider.Claims(&discoveryClaims); err == nil {
			s.endSessionEndpoint = discoveryClaims.EndSessionEndpoint
		}
	}
	return s
}

// IsConfigured returns true if the OIDC provider is set up.
func (s *OAuthService) IsConfigured() bool {
	return s.provider != nil
}

// GetAuthURL returns the OIDC authorization URL and a signed JWT state value.
func (s *OAuthService) GetAuthURL() (string, string, error) {
	if s.provider == nil {
		return "", "", fmt.Errorf("OIDC provider not configured")
	}

	state, err := s.generateState()
	if err != nil {
		return "", "", fmt.Errorf("generating state: %w", err)
	}

	authURL := s.oauth2.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return authURL, state, nil
}

// HandleCallback exchanges the authorization code for tokens, verifies the
// ID token, and returns the provider name ("oidc"), the subject claim,
// the raw ID token claims as JSON, and the raw ID token string (for logout).
func (s *OAuthService) HandleCallback(ctx context.Context, code string) (string, string, json.RawMessage, string, error) {
	if s.provider == nil {
		return "", "", nil, "", fmt.Errorf("OIDC provider not configured")
	}

	token, err := s.oauth2.Exchange(ctx, code)
	if err != nil {
		return "", "", nil, "", fmt.Errorf("exchanging code: %w", err)
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return "", "", nil, "", fmt.Errorf("no id_token in token response")
	}

	idToken, err := s.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return "", "", nil, "", fmt.Errorf("verifying id_token: %w", err)
	}

	var claims json.RawMessage
	if err := idToken.Claims(&claims); err != nil {
		return "", "", nil, "", fmt.Errorf("extracting claims: %w", err)
	}

	return "oidc", idToken.Subject, claims, rawIDToken, nil
}

// GetLogoutURL builds the OIDC RP-Initiated Logout URL. If idTokenHint is
// provided, Keycloak will skip the logout confirmation page.
func (s *OAuthService) GetLogoutURL(idTokenHint, postLogoutRedirectURI string) string {
	if s.endSessionEndpoint == "" {
		return ""
	}
	u := s.endSessionEndpoint + "?post_logout_redirect_uri=" + postLogoutRedirectURI + "&client_id=" + s.cfg.OIDCClientID
	if idTokenHint != "" {
		u += "&id_token_hint=" + idTokenHint
	}
	return u
}

// VerifyState validates a state JWT produced by generateState.
func (s *OAuthService) VerifyState(state string) error {
	_, err := jwt.Parse(state, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	return err
}

// generateState creates a short-lived JWT containing a random nonce that is
// used as the OAuth state parameter to prevent CSRF attacks.
func (s *OAuthService) generateState() (string, error) {
	nonce, err := cryptoRandString(32)
	if err != nil {
		return "", err
	}
	claims := jwt.MapClaims{
		"nonce": nonce,
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

// cryptoRandString returns a cryptographically random alphanumeric string of
// the given length using crypto/rand.
func cryptoRandString(n int) (string, error) {
	const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		b[i] = alphabet[idx.Int64()]
	}
	return string(b), nil
}
