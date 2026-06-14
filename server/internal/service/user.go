package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/repository"
)

type UserService struct {
	repo    *repository.UserRepo
	tagRepo *repository.TagRepo
	cfg     *config.Config
}

func NewUserService(repo *repository.UserRepo, tagRepo *repository.TagRepo, cfg *config.Config) *UserService {
	return &UserService{repo: repo, tagRepo: tagRepo, cfg: cfg}
}

// TokenExpiry returns the configured JWT lifetime, falling back to 24h when
// JWT_EXPIRY is unset or unparseable. Callers (e.g. cookie issuance) use this
// to keep the auth cookie's lifetime aligned with the token it carries.
func (s *UserService) TokenExpiry() time.Duration {
	expiry, err := time.ParseDuration(s.cfg.JWTExpiry)
	if err != nil {
		return 24 * time.Hour
	}
	return expiry
}

func (s *UserService) GenerateToken(userID int64) (string, error) {
	expiry := s.TokenExpiry()

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(expiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *UserService) GetUser(ctx context.Context, userID int64) (*model.User, error) {
	return s.repo.GetByID(ctx, userID)
}

// BackfillOIDCIssuer stamps the configured OIDC issuer onto legacy OIDC users
// that predate the issuer column. It is a no-op when OIDC is not configured.
func (s *UserService) BackfillOIDCIssuer(ctx context.Context) (int64, error) {
	if s.cfg.OIDCIssuerURL == "" {
		return 0, nil
	}
	return s.repo.BackfillOIDCIssuer(ctx, s.cfg.OIDCIssuerURL)
}

func (s *UserService) DeleteUser(ctx context.Context, userID int64) error {
	return s.repo.Delete(ctx, userID)
}

func (s *UserService) FindOrCreateOAuthUser(ctx context.Context, source, issuer, sourceID string, sourceData []byte) (*model.User, error) {
	user, err := s.repo.GetBySourceID(ctx, source, issuer, sourceID)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	// Create new user
	src := source
	iss := issuer
	sid := sourceID
	raw := json.RawMessage(sourceData)
	newUser := &model.User{
		Source:     &src,
		Issuer:     &iss,
		SourceID:  &sid,
		SourceData: &raw,
	}

	id, err := s.repo.Create(ctx, newUser)
	if err != nil {
		return nil, err
	}

	// Create default tag hierarchy
	defaultNodes := []model.TagNode{
		{Name: "portal", Parent: "root", Index: 0},
	}
	if err := s.tagRepo.SaveHierarchy(ctx, id, defaultNodes); err != nil {
		return nil, err
	}

	newUser.ID = id
	return newUser, nil
}
