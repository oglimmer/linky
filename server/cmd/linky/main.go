package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/oli/linky/internal/config"
	"github.com/oli/linky/internal/database"
	"github.com/oli/linky/internal/handler"
	mcpserver "github.com/oli/linky/internal/mcp"
	"github.com/oli/linky/internal/middleware"
	"github.com/oli/linky/internal/repository"
	"github.com/oli/linky/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := database.RunMigrations(db); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	// Repositories
	userRepo := repository.NewUserRepo(db)
	linkRepo := repository.NewLinkRepo(db)
	tagRepo := repository.NewTagRepo(db)
	feedRepo := repository.NewFeedRepo(db)
	mcpOAuthRepo := repository.NewMCPOAuthRepo(db)

	// Services
	userSvc := service.NewUserService(userRepo, tagRepo, cfg)
	linkSvc := service.NewLinkService(linkRepo, tagRepo, cfg)
	contentSvc := service.NewContentService(cfg)
	tagSvc := service.NewTagService(tagRepo, linkRepo)
	rssSvc := service.NewRssService(feedRepo, linkRepo)
	oauthSvc := service.NewOAuthService(cfg)
	mcpOAuthSvc := service.NewMCPOAuthService(mcpOAuthRepo, userSvc, cfg)

	// Backfill the issuer column for legacy OIDC users created before identities
	// were bound to their issuer. Safe and idempotent: every pre-existing
	// source='oidc' row was issued by the single configured OIDC provider.
	if n, err := userSvc.BackfillOIDCIssuer(context.Background()); err != nil {
		slog.Error("failed to backfill OIDC issuer", "error", err)
		os.Exit(1)
	} else if n > 0 {
		slog.Info("backfilled OIDC issuer for legacy users", "rows", n)
	}

	// Handlers
	authHandler := handler.NewAuthHandler(userSvc)
	linkHandler := handler.NewLinkHandler(linkSvc, contentSvc, userSvc)
	tagHandler := handler.NewTagHandler(tagSvc)
	rssHandler := handler.NewRssHandler(rssSvc)
	leaveHandler := handler.NewLeaveHandler(linkSvc, rssSvc)
	oauthHandler := handler.NewOAuthHandler(oauthSvc, userSvc, cfg)
	mcpOAuthHandler := handler.NewMCPOAuthHandler(mcpOAuthSvc, oauthSvc, cfg)
	mcpSrv := mcpserver.NewServer(linkSvc, tagSvc, rssSvc, mcpOAuthSvc)

	// Router
	r := chi.NewRouter()
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RealIP)
	r.Use(middleware.Logging)

	// Public routes
	r.Get("/auth/oidc", oauthHandler.Init)
	r.Get("/authback/oidc", oauthHandler.Callback)
	r.Get("/auth/logout", oauthHandler.Logout)

	// MCP endpoint and its OAuth 2.1 authorization server. These are grouped
	// under CORS so MCP clients can discover and connect cross-origin; the /mcp
	// handler enforces its own bearer-token authentication.
	r.Group(func(r chi.Router) {
		r.Use(middleware.CORS)

		// OAuth metadata (RFC 9728 / RFC 8414).
		r.Get("/.well-known/oauth-protected-resource", mcpOAuthHandler.ProtectedResourceMetadata)
		r.Get("/.well-known/oauth-protected-resource/mcp", mcpOAuthHandler.ProtectedResourceMetadata)
		r.Get("/.well-known/oauth-authorization-server", mcpOAuthHandler.AuthorizationServerMetadata)
		r.Get("/.well-known/oauth-authorization-server/mcp", mcpOAuthHandler.AuthorizationServerMetadata)

		// OAuth endpoints: dynamic client registration, authorize, token.
		r.Post("/oauth/register", mcpOAuthHandler.Register)
		r.Get("/oauth/authorize", mcpOAuthHandler.Authorize)
		r.Post("/oauth/token", mcpOAuthHandler.Token)

		// MCP Streamable HTTP transport (handles GET/POST/DELETE).
		r.Handle("/mcp", mcpSrv.Handler())
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		r.Post("/rest/logout", authHandler.Logout)
		r.Get("/rest/users/me", authHandler.GetUser)
		r.Delete("/rest/users/me", authHandler.DeleteUser)

		// Link routes — register specific patterns before the catch-all {tags} pattern.
		r.Post("/rest/links", linkHandler.Create)
		r.Post("/rest/archive", linkHandler.Archive)
		r.Patch("/rest/links/tags", linkHandler.RenameTag)
		r.Get("/rest/links/{linkid}/rss", rssHandler.GetUpdateCount)
		r.Get("/rest/links/{linkid}/rssDetails", rssHandler.GetUpdateDetails)
		r.Post("/rest/links/{linkid}/rss/read", rssHandler.MarkAsRead)
		r.Get("/rest/links/{linkid}/favicon", linkHandler.GetFavicon)
		r.Put("/rest/links/{linkid}", linkHandler.Update)
		r.Delete("/rest/links/{linkid}", linkHandler.Delete)
		r.Get("/rest/links/{tags}", linkHandler.GetByTag)

		// Search
		r.Get("/rest/search/links", linkHandler.Search)

		// Tags
		r.Get("/rest/tags/hierarchy", tagHandler.GetHierarchy)
		r.Put("/rest/tags/hierarchy", tagHandler.SaveHierarchy)
		r.Delete("/rest/tags/{name}", tagHandler.DeleteTag)

		// Leave (click tracking)
		r.Get("/leave", leaveHandler.Leave)
	})

	// SPA fallback — serve the Vue client if the dist directory exists.
	clientDist := "../client/dist"
	if _, err := os.Stat(clientDist); err == nil {
		slog.Info("serving Vue client", "path", clientDist)
		fs := http.FileServer(http.Dir(clientDist))
		r.Get("/*", func(w http.ResponseWriter, req *http.Request) {
			// Try the requested file first; fall back to index.html for SPA routes.
			path := clientDist + req.URL.Path
			if _, err := os.Stat(path); os.IsNotExist(err) {
				http.ServeFile(w, req, clientDist+"/index.html")
				return
			}
			fs.ServeHTTP(w, req)
		})
	}

	addr := fmt.Sprintf(":%d", cfg.Port)
	slog.Info("server starting", "addr", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
