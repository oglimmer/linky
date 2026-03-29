package service

import (
	"context"
	"fmt"

	"github.com/oli/linky/internal/model"
	"github.com/oli/linky/internal/repository"
)

type TagService struct {
	tagRepo  *repository.TagRepo
	linkRepo *repository.LinkRepo
}

func NewTagService(tagRepo *repository.TagRepo, linkRepo *repository.LinkRepo) *TagService {
	return &TagService{tagRepo: tagRepo, linkRepo: linkRepo}
}

func (s *TagService) GetHierarchy(ctx context.Context, userID int64) (*model.TagHierarchyResponse, error) {
	nodes, err := s.tagRepo.GetHierarchy(ctx, userID)
	if err != nil {
		return nil, err
	}

	counts, err := s.linkRepo.GetTagCounts(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &model.TagHierarchyResponse{
		Tree:     nodes,
		TagCount: counts,
	}, nil
}

func (s *TagService) SaveHierarchy(ctx context.Context, userID int64, payload model.TagHierarchyPayload) error {
	// Validate: no duplicates, all parents exist or are "root"
	names := make(map[string]bool)
	for _, n := range payload.Tree {
		if names[n.Name] {
			return fmt.Errorf("duplicate tag name: %s", n.Name)
		}
		names[n.Name] = true
	}

	for _, n := range payload.Tree {
		if n.Parent != "root" && !names[n.Parent] {
			return fmt.Errorf("parent %q not found for tag %q", n.Parent, n.Name)
		}
	}

	return s.tagRepo.SaveHierarchy(ctx, userID, payload.Tree)
}

func (s *TagService) DeleteTag(ctx context.Context, userID int64, tagName string) error {
	if readonlyTags[tagName] {
		return fmt.Errorf("cannot delete system tag %q", tagName)
	}

	hasChildren, err := s.tagRepo.HasChildren(ctx, userID, tagName)
	if err != nil {
		return err
	}
	if hasChildren {
		return fmt.Errorf("cannot delete tag %q: has children", tagName)
	}

	return s.tagRepo.DeleteTag(ctx, userID, tagName)
}
