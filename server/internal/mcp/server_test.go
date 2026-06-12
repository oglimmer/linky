package mcp

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/service"
)

const testSecret = "test-secret"

func newTestServer(t *testing.T) (*httptest.Server, *service.MCPOAuthService) {
	t.Helper()
	cfg := &config.Config{
		JWTSecret:     testSecret,
		JWTExpiry:     "24h",
		PublicBaseURL: "https://linky.example.com",
	}
	userSvc := service.NewUserService(nil, nil, cfg)
	mcpSvc := service.NewMCPOAuthService(nil, userSvc, cfg)

	// Link/tag services are nil: the cases below only exercise the auth layer
	// and tool listing, neither of which touches the data services.
	srv := NewServer(nil, nil, nil, mcpSvc)
	ts := httptest.NewServer(srv.Handler())
	t.Cleanup(ts.Close)
	return ts, mcpSvc
}

func mcpToken(t *testing.T, mcpSvc *service.MCPOAuthService, userID int64) string {
	t.Helper()
	claims := jwt.MapClaims{
		"user_id": userID,
		"scope":   service.MCPScope,
		"aud":     mcpSvc.Resource(),
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(testSecret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

func postInitialize(t *testing.T, url, bearer string) *http.Response {
	t.Helper()
	body := `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}`
	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(body))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	return resp
}

func TestMCPRequiresAuth(t *testing.T) {
	ts, _ := newTestServer(t)

	resp := postInitialize(t, ts.URL, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 without token, got %d", resp.StatusCode)
	}
	if wa := resp.Header.Get("WWW-Authenticate"); !strings.Contains(wa, "resource_metadata=") {
		t.Fatalf("expected WWW-Authenticate to point at resource metadata, got %q", wa)
	}
}

func TestMCPRejectsInvalidToken(t *testing.T) {
	ts, _ := newTestServer(t)

	resp := postInitialize(t, ts.URL, "not-a-real-token")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 with bad token, got %d", resp.StatusCode)
	}
}

func TestMCPAcceptsValidToken(t *testing.T) {
	ts, mcpSvc := newTestServer(t)

	resp := postInitialize(t, ts.URL, mcpToken(t, mcpSvc, 1))
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 with valid token, got %d", resp.StatusCode)
	}
}

func TestMCPListsAllTools(t *testing.T) {
	ts, mcpSvc := newTestServer(t)
	bearer := mcpToken(t, mcpSvc, 1)

	// Handshake: initialize, capturing the session id the transport requires
	// for subsequent requests.
	initResp := postInitialize(t, ts.URL, bearer)
	defer initResp.Body.Close()
	session := initResp.Header.Get("Mcp-Session-Id")
	if session == "" {
		t.Fatal("expected an Mcp-Session-Id from initialize")
	}

	body := `{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}`
	req, err := http.NewRequest(http.MethodPost, ts.URL, strings.NewReader(body))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")
	req.Header.Set("Authorization", "Bearer "+bearer)
	req.Header.Set("Mcp-Session-Id", session)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}

	want := []string{
		"list_links", "search_links", "get_link", "create_link", "update_link",
		"delete_link", "list_tags", "rename_tag", "delete_tag", "set_tag_hierarchy",
		"list_rss_updates", "mark_rss_read",
	}
	for _, name := range want {
		if !strings.Contains(string(raw), `"name":"`+name+`"`) {
			t.Errorf("tools/list missing tool %q", name)
		}
	}
}
