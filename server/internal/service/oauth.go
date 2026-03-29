package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"

	"github.com/oli/linky/internal/config"
)

// OAuthProvider holds the configuration for a single OAuth provider.
type OAuthProvider struct {
	Name      string
	OAuth2Cfg *oauth2.Config
	UserURL   string         // endpoint to fetch user profile info
	UserIDKey string         // JSON key for the user ID field; defaults to "id"
	IsOpenID  bool
}

// OAuthService manages OAuth provider configurations and authorization flows.
type OAuthService struct {
	cfg       *config.Config
	providers map[string]*OAuthProvider
}

// NewOAuthService initialises an OAuthService and registers every provider
// whose client ID is present in the configuration.
func NewOAuthService(cfg *config.Config) *OAuthService {
	s := &OAuthService{cfg: cfg, providers: make(map[string]*OAuthProvider)}
	s.initProviders()
	return s
}

func (s *OAuthService) initProviders() {
	if s.cfg.GitHubClientID != "" {
		s.providers["github"] = &OAuthProvider{
			Name: "github",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.GitHubClientID,
				ClientSecret: s.cfg.GitHubClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/github",
				Scopes:       []string{"user:email"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://github.com/login/oauth/authorize",
					TokenURL: "https://github.com/login/oauth/access_token",
				},
			},
			UserURL: "https://api.github.com/user",
		}
	}

	if s.cfg.FacebookClientID != "" {
		s.providers["facebook"] = &OAuthProvider{
			Name: "facebook",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.FacebookClientID,
				ClientSecret: s.cfg.FacebookClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/facebook",
				Scopes:       []string{"email"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://www.facebook.com/v18.0/dialog/oauth",
					TokenURL: "https://graph.facebook.com/v18.0/oauth/access_token",
				},
			},
			UserURL: "https://graph.facebook.com/me?fields=id,name,email",
		}
	}

	if s.cfg.BitbucketClientID != "" {
		s.providers["bitbucket"] = &OAuthProvider{
			Name: "bitbucket",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.BitbucketClientID,
				ClientSecret: s.cfg.BitbucketClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/bitbucket",
				Scopes:       []string{"account"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://bitbucket.org/site/oauth2/authorize",
					TokenURL: "https://bitbucket.org/site/oauth2/access_token",
				},
			},
			UserURL:   "https://api.bitbucket.org/2.0/user",
			UserIDKey: "account_id",
		}
	}

	if s.cfg.RedditClientID != "" {
		s.providers["reddit"] = &OAuthProvider{
			Name: "reddit",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.RedditClientID,
				ClientSecret: s.cfg.RedditClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/reddit",
				Scopes:       []string{"identity"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://www.reddit.com/api/v1/authorize",
					TokenURL: "https://www.reddit.com/api/v1/access_token",
				},
			},
			UserURL: "https://oauth.reddit.com/api/v1/me",
		}
	}

}

// GetProvider returns the named provider, if configured.
func (s *OAuthService) GetProvider(name string) (*OAuthProvider, bool) {
	p, ok := s.providers[name]
	return p, ok
}

// GetAuthURL returns the OAuth authorization URL and a signed JWT state value.
func (s *OAuthService) GetAuthURL(provider string) (string, string, error) {
	p, ok := s.providers[provider]
	if !ok {
		return "", "", fmt.Errorf("unknown provider: %s", provider)
	}

	state, err := s.generateState()
	if err != nil {
		return "", "", fmt.Errorf("generating state: %w", err)
	}

	authURL := p.OAuth2Cfg.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return authURL, state, nil
}

// HandleCallback exchanges the authorization code for an access token, fetches
// the user profile, and returns the provider name, the provider-specific user
// ID, and the raw profile JSON.
func (s *OAuthService) HandleCallback(ctx context.Context, provider, code, state string) (string, string, json.RawMessage, error) {
	p, ok := s.providers[provider]
	if !ok {
		return "", "", nil, fmt.Errorf("unknown provider: %s", provider)
	}

	token, err := p.OAuth2Cfg.Exchange(ctx, code)
	if err != nil {
		return "", "", nil, fmt.Errorf("exchanging code: %w", err)
	}

	client := p.OAuth2Cfg.Client(ctx, token)
	resp, err := client.Get(p.UserURL)
	if err != nil {
		return "", "", nil, fmt.Errorf("getting user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", nil, fmt.Errorf("user info endpoint returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", nil, fmt.Errorf("reading user info: %w", err)
	}

	var userData map[string]interface{}
	if err := json.Unmarshal(body, &userData); err != nil {
		return "", "", nil, fmt.Errorf("parsing user info: %w", err)
	}

	idKey := "id"
	if p.UserIDKey != "" {
		idKey = p.UserIDKey
	}

	userID, err := extractStringID(userData, idKey)
	if err != nil {
		return "", "", nil, err
	}

	return provider, userID, body, nil
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

// extractStringID pulls a user-ID value from a JSON map, handling both
// string and numeric representations.
func extractStringID(data map[string]interface{}, key string) (string, error) {
	v, ok := data[key]
	if !ok {
		return "", fmt.Errorf("user info missing key %q", key)
	}
	switch id := v.(type) {
	case string:
		return id, nil
	case float64:
		return fmt.Sprintf("%.0f", id), nil
	default:
		return "", fmt.Errorf("could not extract user ID from key %q (type %T)", key, v)
	}
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
