package handler

import (
	"net/http"
	"net/url"
	"time"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/service"
)

// OAuthHandler serves the OIDC initiation and callback HTTP endpoints.
type OAuthHandler struct {
	oauthSvc *service.OAuthService
	userSvc  *service.UserService
	cfg      *config.Config
}

// NewOAuthHandler creates a handler wired to the given services and config.
func NewOAuthHandler(oauthSvc *service.OAuthService, userSvc *service.UserService, cfg *config.Config) *OAuthHandler {
	return &OAuthHandler{oauthSvc: oauthSvc, userSvc: userSvc, cfg: cfg}
}

// Init starts the OIDC flow by redirecting the user to the identity provider.
func (h *OAuthHandler) Init(w http.ResponseWriter, r *http.Request) {
	authURL, state, err := h.oauthSvc.GetAuthURL()
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// Store the state JWT in a cookie for CSRF verification.
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   900,
	})

	http.Redirect(w, r, authURL, http.StatusFound)
}

// Callback handles the OIDC provider redirect. It exchanges the authorization
// code for a token, verifies the ID token, finds or creates a local user,
// issues a JWT, and redirects the browser to the application.
func (h *OAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	// Verify the state cookie matches the state parameter.
	stateCookie, cookieErr := r.Cookie("oauth_state")
	if cookieErr != nil || stateCookie.Value != state {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid state"})
		return
	}

	// Verify the state JWT signature and expiry.
	if verr := h.oauthSvc.VerifyState(state); verr != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "expired or tampered state"})
		return
	}

	// Clear the state cookie.
	http.SetCookie(w, &http.Cookie{
		Name:   "oauth_state",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	source, sourceID, sourceData, rawIDToken, err := h.oauthSvc.HandleCallback(r.Context(), code)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "OAuth failed: " + err.Error()})
		return
	}

	// Find or create the local user associated with this OIDC identity.
	user, err := h.userSvc.FindOrCreateOAuthUser(r.Context(), source, sourceID, sourceData)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create user"})
		return
	}

	// Issue a JWT for the local session.
	token, err := h.userSvc.GenerateToken(user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate token"})
		return
	}

	// Set the auth token cookie.
	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    token,
		Path:     "/",
		HttpOnly: false,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400 * 365,
		Expires:  time.Now().Add(365 * 24 * time.Hour),
	})

	// Store the OIDC id_token for RP-Initiated Logout.
	http.SetCookie(w, &http.Cookie{
		Name:     "oidc_id_token",
		Value:    rawIDToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400 * 365,
		Expires:  time.Now().Add(365 * 24 * time.Hour),
	})

	// Redirect to the application.
	http.Redirect(w, r, "/links/portal", http.StatusFound)
}

// Logout performs RP-Initiated Logout: clears local session cookies and
// redirects the browser to the OIDC provider's end_session_endpoint.
func (h *OAuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Read id_token_hint from the cookie before clearing.
	var idTokenHint string
	if c, err := r.Cookie("oidc_id_token"); err == nil {
		idTokenHint = c.Value
	}

	// Clear all auth cookies.
	for _, name := range []string{"authToken", "oidc_id_token", "visitorToken"} {
		http.SetCookie(w, &http.Cookie{
			Name:   name,
			Value:  "",
			Path:   "/",
			MaxAge: -1,
		})
	}

	// Build the post-logout redirect URI (the app's login page).
	baseURL := h.cfg.OAuthRedirectBase
	if u, err := url.Parse(baseURL); err == nil {
		u.Path = "/"
		baseURL = u.String()
	}

	logoutURL := h.oauthSvc.GetLogoutURL(idTokenHint, baseURL)
	if logoutURL == "" {
		// Fallback if end_session_endpoint is not available.
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}

	http.Redirect(w, r, logoutURL, http.StatusFound)
}
