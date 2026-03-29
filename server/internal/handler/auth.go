package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/middleware"
	"github.com/oli/linky/internal/service"
)

type AuthHandler struct {
	userSvc *service.UserService
	cfg     *config.Config
}

func NewAuthHandler(userSvc *service.UserService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{userSvc: userSvc, cfg: cfg}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password required"})
		return
	}

	id, err := h.userSvc.Register(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "email already taken"})
			return
		}
		if errors.Is(err, service.ErrUserPassDisabled) {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "email/password auth is disabled"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "registration failed"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *AuthHandler) Authenticate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	token, err := h.userSvc.Authenticate(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
			return
		}
		slog.Error("authentication failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "authentication failed"})
		return
	}

	// Also set cookie for compat
	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		MaxAge:   86400 * 365,
	})

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:   "authToken",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:   "visitorToken",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
	writeJSON(w, http.StatusOK, "ok")
}

func (h *AuthHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	user, err := h.userSvc.GetUser(r.Context(), userID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if err := h.userSvc.DeleteUser(r.Context(), userID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete user"})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:   "authToken",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	writeJSON(w, http.StatusOK, map[string]string{"result": "ok"})
}

// writeJSON is a helper used by all handlers.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
