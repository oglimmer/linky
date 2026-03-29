package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"

	"github.com/oli/linky/internal/config"
)

// OAuthProvider holds the configuration for a single OAuth provider.
type OAuthProvider struct {
	Name      string
	OAuth2Cfg *oauth2.Config // nil for OAuth 1.0a providers (Twitter)
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
	if s.cfg.GoogleClientID != "" {
		s.providers["google"] = &OAuthProvider{
			Name: "google",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.GoogleClientID,
				ClientSecret: s.cfg.GoogleClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/google",
				Scopes:       []string{"openid", "email", "profile"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://accounts.google.com/o/oauth2/auth",
					TokenURL: "https://oauth2.googleapis.com/token",
				},
			},
			UserURL:  "https://www.googleapis.com/oauth2/v2/userinfo",
			IsOpenID: true,
		}
	}

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

	if s.cfg.LinkedInClientID != "" {
		s.providers["linkedin"] = &OAuthProvider{
			Name: "linkedin",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.LinkedInClientID,
				ClientSecret: s.cfg.LinkedInClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/linkedin",
				Scopes:       []string{"openid", "profile", "email"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://www.linkedin.com/oauth/v2/authorization",
					TokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
				},
			},
			UserURL: "https://api.linkedin.com/v2/userinfo",
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

	if s.cfg.YahooClientID != "" {
		s.providers["yahoo"] = &OAuthProvider{
			Name: "yahoo",
			OAuth2Cfg: &oauth2.Config{
				ClientID:     s.cfg.YahooClientID,
				ClientSecret: s.cfg.YahooClientSecret,
				RedirectURL:  s.cfg.OAuthRedirectBase + "/yahoo",
				Scopes:       []string{"openid"},
				Endpoint: oauth2.Endpoint{
					AuthURL:  "https://api.login.yahoo.com/oauth2/request_auth",
					TokenURL: "https://api.login.yahoo.com/oauth2/get_token",
				},
			},
			UserURL:  "https://api.login.yahoo.com/openid/v1/userinfo",
			IsOpenID: true,
		}
	}
}

// GetProvider returns the named provider, if configured.
func (s *OAuthService) GetProvider(name string) (*OAuthProvider, bool) {
	p, ok := s.providers[name]
	return p, ok
}

// GetAuthURL returns the OAuth authorization URL and a state/token value.
// For OAuth 2.0 providers the state is a signed JWT; for Twitter it is the
// request token returned by the Twitter API.
func (s *OAuthService) GetAuthURL(provider string) (string, string, error) {
	if provider == "twitter" {
		return s.twitterGetAuthURL()
	}

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

// HandleCallback exchanges the authorization code (or verifier, for Twitter)
// for an access token, fetches the user profile, and returns the provider
// name, the provider-specific user ID, and the raw profile JSON.
func (s *OAuthService) HandleCallback(ctx context.Context, provider, code, state string) (string, string, json.RawMessage, error) {
	if provider == "twitter" {
		return s.twitterHandleCallback(ctx, code, state)
	}

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

// ---------------------------------------------------------------------------
// Twitter OAuth 1.0a
// ---------------------------------------------------------------------------

func (s *OAuthService) twitterGetAuthURL() (string, string, error) {
	if s.cfg.TwitterConsumerKey == "" {
		return "", "", fmt.Errorf("twitter not configured")
	}

	callbackURL := s.cfg.OAuthRedirectBase + "/twitter"

	params := url.Values{
		"oauth_callback":         {callbackURL},
		"oauth_consumer_key":     {s.cfg.TwitterConsumerKey},
		"oauth_nonce":            {mustNonce()},
		"oauth_signature_method": {"HMAC-SHA1"},
		"oauth_timestamp":        {fmt.Sprintf("%d", time.Now().Unix())},
		"oauth_version":          {"1.0"},
	}

	baseURL := "https://api.twitter.com/oauth/request_token"
	signature := s.signOAuth1(http.MethodPost, baseURL, params, "")
	params.Set("oauth_signature", signature)

	req, err := http.NewRequest(http.MethodPost, baseURL, nil)
	if err != nil {
		return "", "", fmt.Errorf("building request token request: %w", err)
	}
	req.Header.Set("Authorization", buildOAuth1Header(params))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("twitter request token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("reading twitter response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("twitter request token returned %d: %s", resp.StatusCode, body)
	}

	vals, err := url.ParseQuery(string(body))
	if err != nil {
		return "", "", fmt.Errorf("parsing twitter response: %w", err)
	}

	oauthToken := vals.Get("oauth_token")
	if oauthToken == "" {
		return "", "", fmt.Errorf("twitter response missing oauth_token")
	}

	authURL := "https://api.twitter.com/oauth/authenticate?oauth_token=" + url.QueryEscape(oauthToken)
	return authURL, oauthToken, nil
}

func (s *OAuthService) twitterHandleCallback(ctx context.Context, oauthVerifier, oauthToken string) (string, string, json.RawMessage, error) {
	params := url.Values{
		"oauth_consumer_key":     {s.cfg.TwitterConsumerKey},
		"oauth_nonce":            {mustNonce()},
		"oauth_signature_method": {"HMAC-SHA1"},
		"oauth_timestamp":        {fmt.Sprintf("%d", time.Now().Unix())},
		"oauth_token":            {oauthToken},
		"oauth_verifier":         {oauthVerifier},
		"oauth_version":          {"1.0"},
	}

	baseURL := "https://api.twitter.com/oauth/access_token"
	signature := s.signOAuth1(http.MethodPost, baseURL, params, "")
	params.Set("oauth_signature", signature)

	req, err := http.NewRequest(http.MethodPost, baseURL, nil)
	if err != nil {
		return "", "", nil, fmt.Errorf("building access token request: %w", err)
	}
	req.Header.Set("Authorization", buildOAuth1Header(params))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", nil, fmt.Errorf("twitter access token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", nil, fmt.Errorf("reading twitter access token response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", "", nil, fmt.Errorf("twitter access token returned %d: %s", resp.StatusCode, body)
	}

	vals, err := url.ParseQuery(string(body))
	if err != nil {
		return "", "", nil, fmt.Errorf("parsing twitter access token response: %w", err)
	}

	userID := vals.Get("user_id")
	screenName := vals.Get("screen_name")
	if userID == "" {
		return "", "", nil, fmt.Errorf("twitter response missing user_id")
	}

	userData, _ := json.Marshal(map[string]string{
		"user_id":     userID,
		"screen_name": screenName,
	})

	return "twitter", userID, userData, nil
}

// signOAuth1 computes an HMAC-SHA1 OAuth 1.0a signature.
func (s *OAuthService) signOAuth1(method, baseURL string, params url.Values, tokenSecret string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		if k != "oauth_signature" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var pairs []string
	for _, k := range keys {
		pairs = append(pairs, url.QueryEscape(k)+"="+url.QueryEscape(params.Get(k)))
	}
	paramStr := strings.Join(pairs, "&")

	base := method + "&" + url.QueryEscape(baseURL) + "&" + url.QueryEscape(paramStr)
	signingKey := url.QueryEscape(s.cfg.TwitterConsumerSecret) + "&" + url.QueryEscape(tokenSecret)

	mac := hmac.New(sha1.New, []byte(signingKey))
	mac.Write([]byte(base))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

// buildOAuth1Header constructs an Authorization header from OAuth parameters.
func buildOAuth1Header(params url.Values) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		if strings.HasPrefix(k, "oauth_") {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf(`%s="%s"`, url.QueryEscape(k), url.QueryEscape(params.Get(k))))
	}
	return "OAuth " + strings.Join(parts, ", ")
}

// mustNonce returns a cryptographically random alphanumeric nonce.
func mustNonce() string {
	s, err := cryptoRandString(32)
	if err != nil {
		// Fallback: use timestamp-based nonce (still unique per request).
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return s
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
