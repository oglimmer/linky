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

func (s *UserService) GenerateToken(userID int64) (string, error) {
	expiry, err := time.ParseDuration(s.cfg.JWTExpiry)
	if err != nil {
		expiry = 24 * time.Hour
	}

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

func (s *UserService) DeleteUser(ctx context.Context, userID int64) error {
	return s.repo.Delete(ctx, userID)
}

func (s *UserService) FindOrCreateOAuthUser(ctx context.Context, source, sourceID string, sourceData []byte) (*model.User, error) {
	user, err := s.repo.GetBySourceID(ctx, source, sourceID)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	// Create new user
	src := source
	sid := sourceID
	raw := json.RawMessage(sourceData)
	newUser := &model.User{
		Source:     &src,
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
