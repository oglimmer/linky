package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/oli/linky/internal/middleware"
	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/service"
)

type TagHandler struct {
	tagSvc *service.TagService
}

func NewTagHandler(tagSvc *service.TagService) *TagHandler {
	return &TagHandler{tagSvc: tagSvc}
}

func (h *TagHandler) GetHierarchy(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	resp, err := h.tagSvc.GetHierarchy(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *TagHandler) SaveHierarchy(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var payload model.TagHierarchyPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if err := h.tagSvc.SaveHierarchy(r.Context(), userID, payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"result": "ok"})
}

func (h *TagHandler) DeleteTag(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	tagName := chi.URLParam(r, "name")

	if err := h.tagSvc.DeleteTag(r.Context(), userID, tagName); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"result": "ok"})
}
