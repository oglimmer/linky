package mcp

import (
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
	srv := NewServer(nil, nil, mcpSvc)
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
