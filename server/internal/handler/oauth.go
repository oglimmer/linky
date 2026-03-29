package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/service"
)

// OAuthHandler serves the OAuth initiation and callback HTTP endpoints.
type OAuthHandler struct {
	oauthSvc *service.OAuthService
	userSvc  *service.UserService
	cfg      *config.Config
}

// NewOAuthHandler creates a handler wired to the given services and config.
func NewOAuthHandler(oauthSvc *service.OAuthService, userSvc *service.UserService, cfg *config.Config) *OAuthHandler {
	return &OAuthHandler{oauthSvc: oauthSvc, userSvc: userSvc, cfg: cfg}
}

// Init starts the OAuth flow by redirecting the user to the provider's
// authorization page. The provider name is taken from the {type} URL param.
func (h *OAuthHandler) Init(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "type")

	authURL, state, err := h.oauthSvc.GetAuthURL(provider)
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

// Callback handles the OAuth provider redirect. It exchanges the authorization
// code for a token, fetches the user profile, finds or creates a local user,
// issues a JWT, and redirects the browser to the application.
func (h *OAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "type")

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

	source, sourceID, sourceData, err := h.oauthSvc.HandleCallback(r.Context(), provider, code, state)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "OAuth failed: " + err.Error()})
		return
	}

	// Find or create the local user associated with this OAuth identity.
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

	// Set the auth token cookie. HttpOnly is false because the Vue client
	// reads the token from the cookie on the client side.
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

	// Redirect to the application.
	http.Redirect(w, r, "/links/portal", http.StatusFound)
}
