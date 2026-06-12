// Package mcp exposes Linky's bookmark data over the Model Context Protocol.
//
// It mounts a single Streamable HTTP endpoint (/mcp) backed by the official Go
// MCP SDK. Every request is authenticated with an OAuth 2.1 bearer token minted
// by the MCP authorization server (see internal/service/mcpoauth.go); the user
// id carried by that token is threaded into the existing services, which all
// enforce per-user data isolation at the repository layer.
package mcp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/auth"
	sdk "github.com/modelcontextprotocol/go-sdk/mcp"

	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/service"
)

// Server builds and serves the MCP endpoint.
type Server struct {
	linkSvc *service.LinkService
	tagSvc  *service.TagService
	rssSvc  *service.RssService
	mcpSvc  *service.MCPOAuthService
}

func NewServer(linkSvc *service.LinkService, tagSvc *service.TagService, rssSvc *service.RssService, mcpSvc *service.MCPOAuthService) *Server {
	return &Server{linkSvc: linkSvc, tagSvc: tagSvc, rssSvc: rssSvc, mcpSvc: mcpSvc}
}

var errNoUser = errors.New("no authenticated user in request")

// Handler returns the bearer-protected Streamable HTTP handler to mount at /mcp.
func (s *Server) Handler() http.Handler {
	server := sdk.NewServer(&sdk.Implementation{Name: "linky", Version: "1.0.0"}, nil)
	s.registerTools(server)

	streamHandler := sdk.NewStreamableHTTPHandler(func(*http.Request) *sdk.Server {
		return server
	}, nil)

	requireToken := auth.RequireBearerToken(s.verifyToken, &auth.RequireBearerTokenOptions{
		ResourceMetadataURL: s.mcpSvc.ProtectedResourceMetadataURL(),
		Scopes:              []string{service.MCPScope},
	})
	return requireToken(streamHandler)
}

// verifyToken validates the MCP access token and surfaces the user id to tool
// handlers via TokenInfo.Extra.
func (s *Server) verifyToken(_ context.Context, token string, _ *http.Request) (*auth.TokenInfo, error) {
	vt, err := s.mcpSvc.VerifyAccessToken(token)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", auth.ErrInvalidToken, err)
	}
	return &auth.TokenInfo{
		UserID:     strconv.FormatInt(vt.UserID, 10),
		Scopes:     vt.Scopes,
		Expiration: vt.ExpiresAt,
		Extra:      map[string]any{"user_id": vt.UserID},
	}, nil
}

// userID extracts the authenticated user id placed on the request by verifyToken.
func userID(req *sdk.CallToolRequest) (int64, error) {
	if req.Extra == nil || req.Extra.TokenInfo == nil {
		return 0, errNoUser
	}
	switch n := req.Extra.TokenInfo.Extra["user_id"].(type) {
	case int64:
		return n, nil
	case float64:
		return int64(n), nil
	case int:
		return int64(n), nil
	}
	return 0, errNoUser
}

// ---- tool definitions ----------------------------------------------------

type listLinksInput struct {
	Tag string `json:"tag,omitempty" jsonschema:"Filter links by this tag. Use 'all' (default) for every link, 'untagged', 'rss', or any user tag."`
}

type searchLinksInput struct {
	Query string `json:"query" jsonschema:"Full-text search query matched against link URL, page title, and notes."`
}

type createLinkInput struct {
	URL    string `json:"url" jsonschema:"The URL to bookmark."`
	Tags   string `json:"tags,omitempty" jsonschema:"Space-separated list of tags to apply."`
	Notes  string `json:"notes,omitempty" jsonschema:"Optional free-form notes for the bookmark."`
	Title  string `json:"title,omitempty" jsonschema:"Optional page title. When omitted it is resolved automatically from the URL."`
	RssURL string `json:"rss_url,omitempty" jsonschema:"Optional RSS/Atom feed URL to track for this bookmark; adds the 'rss' tag."`
}

type getLinkInput struct {
	ID int64 `json:"id" jsonschema:"The numeric id of the link to fetch."`
}

type updateLinkInput struct {
	ID     int64   `json:"id" jsonschema:"The numeric id of the link to update."`
	URL    *string `json:"url,omitempty" jsonschema:"New URL. Omit to leave unchanged."`
	Tags   *string `json:"tags,omitempty" jsonschema:"New space-separated tag list, replacing the existing user tags. Pass an empty string to remove all tags. Omit to leave unchanged."`
	Notes  *string `json:"notes,omitempty" jsonschema:"New notes. Pass an empty string to clear. Omit to leave unchanged."`
	Title  *string `json:"title,omitempty" jsonschema:"New page title. Pass an empty string to clear. Omit to leave unchanged."`
	RssURL *string `json:"rss_url,omitempty" jsonschema:"New RSS/Atom feed URL. Pass an empty string to stop tracking. Omit to leave unchanged."`
}

type deleteLinkInput struct {
	ID int64 `json:"id" jsonschema:"The numeric id of the link to delete."`
}

type renameTagInput struct {
	OldTag string `json:"old_tag" jsonschema:"The existing tag name to rename."`
	NewTag string `json:"new_tag" jsonschema:"The new tag name."`
}

type deleteTagInput struct {
	Tag string `json:"tag" jsonschema:"The tag name to delete. Must have no child tags."`
}

type tagNodeInput struct {
	Name   string `json:"name" jsonschema:"The tag name."`
	Parent string `json:"parent" jsonschema:"The parent tag name, or 'root' for a top-level tag."`
	Index  int    `json:"index" jsonschema:"Sort order among siblings."`
}

type setTagHierarchyInput struct {
	Nodes []tagNodeInput `json:"nodes" jsonschema:"The complete set of tag-hierarchy nodes. This replaces the existing hierarchy."`
}

type rssLinkInput struct {
	LinkID int64 `json:"link_id" jsonschema:"The numeric id of the bookmark whose RSS feed to act on."`
}

func (s *Server) registerTools(server *sdk.Server) {
	sdk.AddTool(server, &sdk.Tool{
		Name:        "list_links",
		Description: "List the authenticated user's bookmarks, optionally filtered by tag.",
	}, s.listLinks)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "search_links",
		Description: "Full-text search the authenticated user's bookmarks.",
	}, s.searchLinks)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "get_link",
		Description: "Fetch a single one of the authenticated user's bookmarks by id.",
	}, s.getLink)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "create_link",
		Description: "Create a new bookmark for the authenticated user. The title and favicon are resolved automatically when not supplied.",
	}, s.createLink)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "update_link",
		Description: "Update an existing bookmark by id. Only the fields you supply are changed; omitted fields are left untouched.",
	}, s.updateLink)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "delete_link",
		Description: "Delete one of the authenticated user's bookmarks by id.",
	}, s.deleteLink)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "list_tags",
		Description: "List the authenticated user's tag hierarchy and per-tag bookmark counts.",
	}, s.listTags)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "rename_tag",
		Description: "Rename one of the authenticated user's tags across all bookmarks and the hierarchy. System tags cannot be renamed.",
	}, s.renameTag)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "delete_tag",
		Description: "Delete one of the authenticated user's tags. The tag must have no child tags. System tags cannot be deleted.",
	}, s.deleteTag)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "set_tag_hierarchy",
		Description: "Replace the authenticated user's tag hierarchy. Provide every node as {name, parent, index}; use parent 'root' for top-level tags.",
	}, s.setTagHierarchy)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "list_rss_updates",
		Description: "List unseen RSS feed entries for one of the authenticated user's bookmarks (those tagged 'rss').",
	}, s.listRssUpdates)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "mark_rss_read",
		Description: "Mark the RSS feed entries of one of the authenticated user's bookmarks as read.",
	}, s.markRssRead)
}

func (s *Server) listLinks(ctx context.Context, req *sdk.CallToolRequest, in listLinksInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	tag := in.Tag
	if tag == "" {
		tag = "all"
	}
	links, err := s.linkSvc.GetByTag(ctx, uid, tag)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(links)
}

func (s *Server) searchLinks(ctx context.Context, req *sdk.CallToolRequest, in searchLinksInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	if in.Query == "" {
		return errorResult(errors.New("query is required")), nil, nil
	}
	links, err := s.linkSvc.Search(ctx, uid, in.Query)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(links)
}

func (s *Server) createLink(ctx context.Context, req *sdk.CallToolRequest, in createLinkInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	if in.URL == "" {
		return errorResult(errors.New("url is required")), nil, nil
	}
	payload := model.LinkPayload{
		URL:       in.URL,
		Tags:      in.Tags,
		Notes:     strPtrOrNil(in.Notes),
		PageTitle: strPtrOrNil(in.Title),
		RssURL:    strPtrOrNil(in.RssURL),
	}
	resp, err := s.linkSvc.Create(ctx, uid, payload)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(resp.Primary)
}

func (s *Server) getLink(ctx context.Context, req *sdk.CallToolRequest, in getLinkInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	link, err := s.linkSvc.GetByID(ctx, uid, in.ID)
	if err != nil {
		return errorResult(err), nil, nil
	}
	if link == nil {
		return errorResult(fmt.Errorf("link %d not found", in.ID)), nil, nil
	}
	return jsonResult(link)
}

func (s *Server) updateLink(ctx context.Context, req *sdk.CallToolRequest, in updateLinkInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	existing, err := s.linkSvc.GetByID(ctx, uid, in.ID)
	if err != nil {
		return errorResult(err), nil, nil
	}
	if existing == nil {
		return errorResult(fmt.Errorf("link %d not found", in.ID)), nil, nil
	}

	// Update is a full replace, so start from the existing values and overlay
	// only the fields the caller supplied.
	payload := model.LinkPayload{
		URL:       existing.URL,
		Tags:      strings.Join(userTags(existing.Tags), " "),
		Notes:     existing.Notes,
		PageTitle: existing.PageTitle,
		RssURL:    existing.RssURL,
	}
	if in.URL != nil {
		payload.URL = *in.URL
	}
	if in.Tags != nil {
		payload.Tags = *in.Tags
	}
	if in.Notes != nil {
		payload.Notes = strPtrOrNil(*in.Notes)
	}
	if in.Title != nil {
		payload.PageTitle = strPtrOrNil(*in.Title)
	}
	if in.RssURL != nil {
		payload.RssURL = strPtrOrNil(*in.RssURL)
	}

	resp, err := s.linkSvc.Update(ctx, uid, in.ID, payload)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(resp.Primary)
}

func (s *Server) deleteLink(ctx context.Context, req *sdk.CallToolRequest, in deleteLinkInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	if err := s.linkSvc.Delete(ctx, uid, in.ID); err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(map[string]any{"deleted": in.ID})
}

func (s *Server) listTags(ctx context.Context, req *sdk.CallToolRequest, _ struct{}) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	resp, err := s.tagSvc.GetHierarchy(ctx, uid)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(resp)
}

func (s *Server) renameTag(ctx context.Context, req *sdk.CallToolRequest, in renameTagInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	if in.OldTag == "" || in.NewTag == "" {
		return errorResult(errors.New("old_tag and new_tag are required")), nil, nil
	}
	count, err := s.linkSvc.RenameTag(ctx, uid, in.OldTag, in.NewTag)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(map[string]any{"renamed": in.OldTag, "to": in.NewTag, "links_updated": count})
}

func (s *Server) deleteTag(ctx context.Context, req *sdk.CallToolRequest, in deleteTagInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	if in.Tag == "" {
		return errorResult(errors.New("tag is required")), nil, nil
	}
	if err := s.tagSvc.DeleteTag(ctx, uid, in.Tag); err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(map[string]any{"deleted": in.Tag})
}

func (s *Server) setTagHierarchy(ctx context.Context, req *sdk.CallToolRequest, in setTagHierarchyInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	tree := make([]model.TagNode, len(in.Nodes))
	for i, n := range in.Nodes {
		parent := n.Parent
		if parent == "" {
			parent = "root"
		}
		tree[i] = model.TagNode{Name: n.Name, Parent: parent, Index: n.Index}
	}
	if err := s.tagSvc.SaveHierarchy(ctx, uid, model.TagHierarchyPayload{Tree: tree}); err != nil {
		return errorResult(err), nil, nil
	}
	resp, err := s.tagSvc.GetHierarchy(ctx, uid)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(resp)
}

func (s *Server) listRssUpdates(ctx context.Context, req *sdk.CallToolRequest, in rssLinkInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	details, err := s.rssSvc.GetUpdateDetails(ctx, uid, in.LinkID)
	if err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(details)
}

func (s *Server) markRssRead(ctx context.Context, req *sdk.CallToolRequest, in rssLinkInput) (*sdk.CallToolResult, any, error) {
	uid, err := userID(req)
	if err != nil {
		return nil, nil, err
	}
	// Ensure the link belongs to the caller before mutating its feed state;
	// MarkAsRead keys only on link id.
	link, err := s.linkSvc.GetByID(ctx, uid, in.LinkID)
	if err != nil {
		return errorResult(err), nil, nil
	}
	if link == nil {
		return errorResult(fmt.Errorf("link %d not found", in.LinkID)), nil, nil
	}
	if err := s.rssSvc.MarkAsRead(ctx, in.LinkID); err != nil {
		return errorResult(err), nil, nil
	}
	return jsonResult(map[string]any{"marked_read": in.LinkID})
}

// ---- input helpers -------------------------------------------------------

// strPtrOrNil returns nil for an empty string, otherwise a pointer to the
// value. Empty optional strings should clear a field rather than store "".
func strPtrOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// userTags filters out Linky's system/read-only tags, leaving only the tags a
// user actually applied. Used to preserve user tags across a partial update
// without re-submitting (and thereby duplicating) system tags.
func userTags(tags []string) []string {
	out := make([]string, 0, len(tags))
	for _, t := range tags {
		if !systemTags[t] {
			out = append(out, t)
		}
	}
	return out
}

// systemTags mirrors the read-only tag set enforced by the link/tag services.
var systemTags = map[string]bool{
	"all": true, "untagged": true, "rss": true, "locked": true, "archive": true,
}

// ---- result helpers ------------------------------------------------------

// jsonResult renders a value as a pretty-printed JSON text content block.
func jsonResult(v any) (*sdk.CallToolResult, any, error) {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return errorResult(err), nil, nil
	}
	return &sdk.CallToolResult{
		Content: []sdk.Content{&sdk.TextContent{Text: string(data)}},
	}, nil, nil
}

// errorResult returns a tool-level error result (isError=true) rather than a
// protocol error, so the model can read the message.
func errorResult(err error) *sdk.CallToolResult {
	return &sdk.CallToolResult{
		IsError: true,
		Content: []sdk.Content{&sdk.TextContent{Text: err.Error()}},
	}
}
