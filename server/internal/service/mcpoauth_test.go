package service

import (
	"crypto/sha256"
	"encoding/base64"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/oli/linky/internal/config"
)

func newTestMCPService(secret string) *MCPOAuthService {
	cfg := &config.Config{
		JWTSecret:     secret,
		JWTExpiry:     "24h",
		PublicBaseURL: "https://linky.example.com",
	}
	userSvc := NewUserService(nil, nil, cfg)
	return NewMCPOAuthService(nil, userSvc, cfg)
}

func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func TestVerifyPKCE(t *testing.T) {
	verifier := "a-very-random-code-verifier-value-1234567890"
	challenge := pkceChallenge(verifier)

	if !verifyPKCE(verifier, challenge, "S256") {
		t.Fatal("expected valid S256 verifier to pass")
	}
	if verifyPKCE("wrong-verifier", challenge, "S256") {
		t.Fatal("expected mismatched verifier to fail")
	}
	if verifyPKCE(verifier, verifier, "plain") {
		t.Fatal("plain method must be rejected")
	}
}

func TestAccessTokenRoundTrip(t *testing.T) {
	s := newTestMCPService("test-secret")

	token, expiresIn, err := s.generateAccessToken(42)
	if err != nil {
		t.Fatalf("generateAccessToken: %v", err)
	}
	if expiresIn <= 0 {
		t.Fatalf("expected positive expires_in, got %d", expiresIn)
	}

	vt, err := s.VerifyAccessToken(token)
	if err != nil {
		t.Fatalf("VerifyAccessToken: %v", err)
	}
	if vt.UserID != 42 {
		t.Fatalf("expected user id 42, got %d", vt.UserID)
	}
	if !containsString(vt.Scopes, MCPScope) {
		t.Fatalf("expected %q scope, got %v", MCPScope, vt.Scopes)
	}
}

func TestVerifyAccessTokenRejectsWrongSecret(t *testing.T) {
	signer := newTestMCPService("secret-a")
	verifier := newTestMCPService("secret-b")

	token, _, err := signer.generateAccessToken(7)
	if err != nil {
		t.Fatalf("generateAccessToken: %v", err)
	}
	if _, err := verifier.VerifyAccessToken(token); err == nil {
		t.Fatal("expected verification with a different secret to fail")
	}
}

func TestVerifyAccessTokenRejectsWrongAudience(t *testing.T) {
	s := newTestMCPService("test-secret")

	// Craft a token with the correct scope but an audience for a different resource.
	claims := jwt.MapClaims{
		"user_id": float64(1),
		"scope":   MCPScope,
		"aud":     "https://evil.example.com/mcp",
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	if _, err := s.VerifyAccessToken(signed); err == nil {
		t.Fatal("expected audience mismatch to be rejected")
	}
}

func TestVerifyAccessTokenRejectsMissingScope(t *testing.T) {
	s := newTestMCPService("test-secret")

	// A plain web-session JWT (no scope claim) must not be accepted at /mcp.
	claims := jwt.MapClaims{
		"user_id": float64(1),
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte("test-secret"))
	if _, err := s.VerifyAccessToken(signed); err == nil {
		t.Fatal("expected token without mcp scope to be rejected")
	}
}

func TestUserIDFromSessionToken(t *testing.T) {
	cfg := &config.Config{JWTSecret: "test-secret", JWTExpiry: "24h", PublicBaseURL: "https://linky.example.com"}
	userSvc := NewUserService(nil, nil, cfg)
	s := NewMCPOAuthService(nil, userSvc, cfg)

	// A normal web-session token issued by UserService should be readable.
	sessionToken, err := userSvc.GenerateToken(99)
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}
	uid, ok := s.UserIDFromSessionToken(sessionToken)
	if !ok || uid != 99 {
		t.Fatalf("expected user id 99, got %d ok=%v", uid, ok)
	}

	if _, ok := s.UserIDFromSessionToken("garbage"); ok {
		t.Fatal("expected garbage token to be rejected")
	}
}
