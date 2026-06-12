package handler

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/service"
)

// MCPOAuthHandler serves the OAuth 2.1 authorization-server endpoints that back
// the MCP resource: protected-resource / authorization-server metadata,
// dynamic client registration, the authorize endpoint, and the token endpoint.
type MCPOAuthHandler struct {
	mcpSvc   *service.MCPOAuthService
	oauthSvc *service.OAuthService
	cfg      *config.Config
}

func NewMCPOAuthHandler(mcpSvc *service.MCPOAuthService, oauthSvc *service.OAuthService, cfg *config.Config) *MCPOAuthHandler {
	return &MCPOAuthHandler{mcpSvc: mcpSvc, oauthSvc: oauthSvc, cfg: cfg}
}

// ProtectedResourceMetadata serves the RFC 9728 document.
func (h *MCPOAuthHandler) ProtectedResourceMetadata(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.mcpSvc.ProtectedResourceMetadata())
}

// AuthorizationServerMetadata serves the RFC 8414 document.
func (h *MCPOAuthHandler) AuthorizationServerMetadata(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.mcpSvc.AuthorizationServerMetadata())
}

// Register implements RFC 7591 dynamic client registration.
func (h *MCPOAuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req service.ClientRegistrationRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeOAuthError(w, http.StatusBadRequest, "invalid_client_metadata", "invalid JSON body")
		return
	}
	resp, oerr := h.mcpSvc.RegisterClient(r.Context(), req)
	if oerr != nil {
		writeOAuthError(w, oerr.Status, oerr.Code, oerr.Description)
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

// Authorize implements the OAuth 2.1 authorization endpoint with PKCE. If the
// user is not yet logged in, it bridges through the existing OIDC login and
// resumes here afterward.
func (h *MCPOAuthHandler) Authorize(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	clientID := q.Get("client_id")
	redirectURI := q.Get("redirect_uri")
	responseType := q.Get("response_type")
	state := q.Get("state")
	codeChallenge := q.Get("code_challenge")
	codeChallengeMethod := q.Get("code_challenge_method")
	scope := q.Get("scope")
	resource := q.Get("resource")

	// Validate the client and redirect URI before trusting redirect_uri as a
	// place to send error responses.
	client, err := h.mcpSvc.GetClient(r.Context(), clientID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if client == nil {
		http.Error(w, "invalid client_id", http.StatusBadRequest)
		return
	}
	if !client.AllowsRedirectURI(redirectURI) {
		http.Error(w, "invalid redirect_uri", http.StatusBadRequest)
		return
	}

	// From here, protocol errors are returned by redirecting to redirect_uri.
	if responseType != "code" {
		redirectAuthError(w, r, redirectURI, state, "unsupported_response_type", "only response_type=code is supported")
		return
	}
	if codeChallenge == "" {
		redirectAuthError(w, r, redirectURI, state, "invalid_request", "code_challenge is required (PKCE)")
		return
	}
	if codeChallengeMethod != "S256" {
		redirectAuthError(w, r, redirectURI, state, "invalid_request", "code_challenge_method must be S256")
		return
	}
	if resource != "" && resource != h.mcpSvc.Resource() {
		redirectAuthError(w, r, redirectURI, state, "invalid_target", "resource does not match this server")
		return
	}

	// Identify the user from the existing web session cookie.
	userID, ok := h.authenticatedUser(r)
	if !ok {
		// Not logged in: bridge through OIDC and resume this request afterward.
		if !h.oauthSvc.IsConfigured() {
			redirectAuthError(w, r, redirectURI, state, "access_denied", "interactive login is not available")
			return
		}
		authURL, stateJWT, gerr := h.oauthSvc.GetAuthURLWithReturn(r.URL.RequestURI())
		if gerr != nil {
			redirectAuthError(w, r, redirectURI, state, "server_error", "failed to start login")
			return
		}
		http.SetCookie(w, &http.Cookie{
			Name:     "oauth_state",
			Value:    stateJWT,
			Path:     "/",
			HttpOnly: true,
			Secure:   h.cfg.CookieSecure,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   900,
		})
		http.Redirect(w, r, authURL, http.StatusFound)
		return
	}

	code, err := h.mcpSvc.IssueAuthorizationCode(r.Context(), clientID, userID, redirectURI, codeChallenge, codeChallengeMethod, scope, resource)
	if err != nil {
		redirectAuthError(w, r, redirectURI, state, "server_error", "failed to issue authorization code")
		return
	}

	u, _ := url.Parse(redirectURI)
	rq := u.Query()
	rq.Set("code", code)
	if state != "" {
		rq.Set("state", state)
	}
	u.RawQuery = rq.Encode()
	http.Redirect(w, r, u.String(), http.StatusFound)
}

// Token implements the OAuth 2.1 token endpoint (authorization_code and
// refresh_token grants).
func (h *MCPOAuthHandler) Token(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		writeOAuthError(w, http.StatusBadRequest, "invalid_request", "could not parse form")
		return
	}

	clientID, clientSecret := clientCredentials(r)
	grantType := r.PostFormValue("grant_type")

	var (
		resp *service.TokenResponse
		oerr *service.OAuthError
	)
	switch grantType {
	case "authorization_code":
		resp, oerr = h.mcpSvc.ExchangeAuthorizationCode(
			r.Context(), clientID, clientSecret,
			r.PostFormValue("redirect_uri"), r.PostFormValue("code"), r.PostFormValue("code_verifier"))
	case "refresh_token":
		resp, oerr = h.mcpSvc.ExchangeRefreshToken(
			r.Context(), clientID, clientSecret, r.PostFormValue("refresh_token"))
	default:
		writeOAuthError(w, http.StatusBadRequest, "unsupported_grant_type", "unsupported grant_type")
		return
	}

	if oerr != nil {
		writeOAuthError(w, oerr.Status, oerr.Code, oerr.Description)
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	writeJSON(w, http.StatusOK, resp)
}

// authenticatedUser returns the user id from the web-session cookie, if valid.
func (h *MCPOAuthHandler) authenticatedUser(r *http.Request) (int64, bool) {
	c, err := r.Cookie("authToken")
	if err != nil || c.Value == "" {
		return 0, false
	}
	return h.mcpSvc.UserIDFromSessionToken(c.Value)
}

// clientCredentials extracts client_id / client_secret from HTTP Basic auth
// (client_secret_basic) or the request body (client_secret_post / public).
func clientCredentials(r *http.Request) (clientID, clientSecret string) {
	if id, secret, ok := r.BasicAuth(); ok {
		return id, secret
	}
	return r.PostFormValue("client_id"), r.PostFormValue("client_secret")
}

func redirectAuthError(w http.ResponseWriter, r *http.Request, redirectURI, state, code, desc string) {
	u, err := url.Parse(redirectURI)
	if err != nil {
		http.Error(w, code+": "+desc, http.StatusBadRequest)
		return
	}
	q := u.Query()
	q.Set("error", code)
	q.Set("error_description", desc)
	if state != "" {
		q.Set("state", state)
	}
	u.RawQuery = q.Encode()
	http.Redirect(w, r, u.String(), http.StatusFound)
}

func writeOAuthError(w http.ResponseWriter, status int, code, desc string) {
	writeJSON(w, status, map[string]string{
		"error":             code,
		"error_description": desc,
	})
}
