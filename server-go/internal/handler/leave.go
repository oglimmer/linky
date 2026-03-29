package handler

import (
	"net/http"
	"strconv"

	"github.com/oli/linky/internal/middleware"
	"github.com/oli/linky/internal/service"
)

type LeaveHandler struct {
	linkSvc *service.LinkService
	rssSvc  *service.RssService
}

func NewLeaveHandler(linkSvc *service.LinkService, rssSvc *service.RssService) *LeaveHandler {
	return &LeaveHandler{linkSvc: linkSvc, rssSvc: rssSvc}
}

func (h *LeaveHandler) Leave(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	targetStr := r.URL.Query().Get("target")
	linkID, err := strconv.ParseInt(targetStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid target"})
		return
	}

	link, err := h.linkSvc.GetByID(r.Context(), userID, linkID)
	if err != nil || link == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "link not found"})
		return
	}

	// Increment call counter
	h.linkSvc.IncrementCallCounter(r.Context(), userID, linkID)

	// Mark RSS as read if applicable
	if link.RssURL != nil && *link.RssURL != "" {
		h.rssSvc.MarkAsRead(r.Context(), linkID)
	}

	// Redirect to the link URL
	http.Redirect(w, r, link.URL, http.StatusFound)
}
