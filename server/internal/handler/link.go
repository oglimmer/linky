package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/oli/linky/internal/middleware"
	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/service"
)

type LinkHandler struct {
	linkSvc *service.LinkService
}

func NewLinkHandler(linkSvc *service.LinkService) *LinkHandler {
	return &LinkHandler{linkSvc: linkSvc}
}

func (h *LinkHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var payload model.LinkPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if payload.URL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "url is required"})
		return
	}

	resp, err := h.linkSvc.Create(r.Context(), userID, payload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

func (h *LinkHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	linkID, err := strconv.ParseInt(chi.URLParam(r, "linkid"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid link id"})
		return
	}

	var payload model.LinkPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	resp, err := h.linkSvc.Update(r.Context(), userID, linkID, payload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *LinkHandler) GetByTag(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	tag := chi.URLParam(r, "tags")

	links, err := h.linkSvc.GetByTag(r.Context(), userID, tag)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if links == nil {
		links = []model.Link{}
	}
	writeJSON(w, http.StatusOK, links)
}

func (h *LinkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	linkID, err := strconv.ParseInt(chi.URLParam(r, "linkid"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid link id"})
		return
	}

	if err := h.linkSvc.Delete(r.Context(), userID, linkID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"result": "ok"})
}

func (h *LinkHandler) Search(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "query parameter 'q' required"})
		return
	}

	links, err := h.linkSvc.Search(r.Context(), userID, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if links == nil {
		links = []model.Link{}
	}
	writeJSON(w, http.StatusOK, links)
}

func (h *LinkHandler) RenameTag(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var payload model.TagRenamePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	count, err := h.linkSvc.RenameTag(r.Context(), userID, payload.OldTagName, payload.NewTagName)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]int64{"count": count})
}

func (h *LinkHandler) GetFavicon(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	linkID, err := strconv.ParseInt(chi.URLParam(r, "linkid"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid link id"})
		return
	}

	faviconURL, err := h.linkSvc.GetFavicon(r.Context(), userID, linkID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "favicon not found"})
		return
	}

	// Proxy the favicon
	resp, err := http.Get(faviconURL)
	if err != nil || resp.StatusCode != 200 {
		if resp != nil {
			resp.Body.Close()
		}
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "favicon not found"})
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.Header().Set("Cache-Control", "public, max-age=86400")
	io.Copy(w, resp.Body)
}
