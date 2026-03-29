package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already taken")
	ErrUserPassDisabled   = errors.New("email/password auth is disabled")
)

type UserService struct {
	repo    *repository.UserRepo
	tagRepo *repository.TagRepo
	cfg     *config.Config
}

func NewUserService(repo *repository.UserRepo, tagRepo *repository.TagRepo, cfg *config.Config) *UserService {
	return &UserService{repo: repo, tagRepo: tagRepo, cfg: cfg}
}

func (s *UserService) Register(ctx context.Context, email, password string) (int64, error) {
	if !s.cfg.EnableUserPass {
		return 0, ErrUserPassDisabled
	}

	existing, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return 0, err
	}
	if existing != nil {
		return 0, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return 0, fmt.Errorf("hashing password: %w", err)
	}

	hashStr := string(hash)
	user := &model.User{
		Email:        &email,
		PasswordHash: &hashStr,
	}

	id, err := s.repo.Create(ctx, user)
	if err != nil {
		return 0, err
	}

	// Create default tag hierarchy with "portal"
	defaultNodes := []model.TagNode{
		{Name: "portal", Parent: "root", Index: 0},
	}
	if err := s.tagRepo.SaveHierarchy(ctx, id, defaultNodes); err != nil {
		return 0, err
	}

	return id, nil
}

func (s *UserService) Authenticate(ctx context.Context, email, password string) (string, error) {
	if !s.cfg.EnableUserPass {
		return "", ErrUserPassDisabled
	}

	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", err
	}
	if user == nil || user.PasswordHash == nil {
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	return s.GenerateToken(user.ID)
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
