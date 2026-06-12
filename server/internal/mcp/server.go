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

	"github.com/modelcontextprotocol/go-sdk/auth"
	sdk "github.com/modelcontextprotocol/go-sdk/mcp"

	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/service"
)

// Server builds and serves the MCP endpoint.
type Server struct {
	linkSvc *service.LinkService
	tagSvc  *service.TagService
	mcpSvc  *service.MCPOAuthService
}

func NewServer(linkSvc *service.LinkService, tagSvc *service.TagService, mcpSvc *service.MCPOAuthService) *Server {
	return &Server{linkSvc: linkSvc, tagSvc: tagSvc, mcpSvc: mcpSvc}
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
	URL   string `json:"url" jsonschema:"The URL to bookmark."`
	Tags  string `json:"tags,omitempty" jsonschema:"Space-separated list of tags to apply."`
	Notes string `json:"notes,omitempty" jsonschema:"Optional free-form notes for the bookmark."`
}

type deleteLinkInput struct {
	ID int64 `json:"id" jsonschema:"The numeric id of the link to delete."`
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
		Name:        "create_link",
		Description: "Create a new bookmark for the authenticated user. The title and favicon are resolved automatically.",
	}, s.createLink)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "delete_link",
		Description: "Delete one of the authenticated user's bookmarks by id.",
	}, s.deleteLink)

	sdk.AddTool(server, &sdk.Tool{
		Name:        "list_tags",
		Description: "List the authenticated user's tag hierarchy and per-tag bookmark counts.",
	}, s.listTags)
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
	payload := model.LinkPayload{URL: in.URL, Tags: in.Tags}
	if in.Notes != "" {
		payload.Notes = &in.Notes
	}
	resp, err := s.linkSvc.Create(ctx, uid, payload)
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
