package handler

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/oli/linky/internal/middleware"
	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/service"
)

type RssHandler struct {
	rssSvc *service.RssService
}

func NewRssHandler(rssSvc *service.RssService) *RssHandler {
	return &RssHandler{rssSvc: rssSvc}
}

func (h *RssHandler) GetUpdateCount(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	linkID, err := strconv.ParseInt(chi.URLParam(r, "linkid"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid link id"})
		return
	}

	count, err := h.rssSvc.GetUpdateCount(r.Context(), userID, linkID)
	if err != nil {
		slog.Error("rss get update count failed", "link_id", linkID, "user_id", userID, "error", err)
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrFeedUnavailable) {
			status = http.StatusBadGateway
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, model.RssCountResponse{Result: count})
}

func (h *RssHandler) GetUpdateDetails(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	linkID, err := strconv.ParseInt(chi.URLParam(r, "linkid"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid link id"})
		return
	}

	details, err := h.rssSvc.GetUpdateDetails(r.Context(), userID, linkID)
	if err != nil {
		slog.Error("rss get update details failed", "link_id", linkID, "user_id", userID, "error", err)
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrFeedUnavailable) {
			status = http.StatusBadGateway
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, details)
}
