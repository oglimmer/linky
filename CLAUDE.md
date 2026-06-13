# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Linky

Linky is a bookmark manager with tagging, full-text search, and RSS feed tracking. It has a Vue 3 SPA frontend and a Go backend backed by MariaDB.

## Commands

### Go server (`server/`)

- `go run ./cmd/linky` — Start server on :8080 (auto-runs DB migrations)
- `go build ./cmd/linky` — Build production binary
- `go run ./cmd/migrate-couchdb` — Migrate data from CouchDB to MariaDB
- `docker compose up -d mariadb` — Start MariaDB for local dev (compose.yml at repo root)

### Vue client (`client/`)

- `npm run dev` — Vite dev server on :3000 (proxies API to :8080)
- `npm run build` — TypeScript check + production build to `dist/`
- `npx vue-tsc -b --noEmit` — TypeScript type check only

## Architecture

### Server (`server/`)

Go server using chi router, sqlx for database access, and embedded SQL migrations.

- `cmd/linky/main.go` — Entry point: config, DB, routing, SPA fallback
- `cmd/migrate-couchdb/main.go` — CouchDB → MariaDB migration CLI
- `internal/config/` — Environment-based config (`caarlos0/env`)
- `internal/database/` — MariaDB connection + golang-migrate with embedded SQL
- `internal/handler/` — HTTP handlers (auth, link, tag, rss, leave, oauth, mcpoauth)
- `internal/middleware/` — JWT auth middleware, request logging, CORS (for MCP)
- `internal/model/` — Domain models with JSON tags matching client contract
- `internal/repository/` — Data access layer (sqlx queries)
- `internal/service/` — Business logic (link creation with URL resolution/title/favicon/system tags, tag hierarchy, RSS polling, OAuth flows, MCP authorization server)
- `internal/mcp/` — Model Context Protocol server: Streamable HTTP `/mcp` endpoint exposing bookmark tools, built on the official Go MCP SDK

### MCP endpoint (`/mcp`)

Linky exposes its bookmarks over MCP and acts as its own OAuth 2.1 Authorization Server + Resource Server:

- `GET /.well-known/oauth-protected-resource` (RFC 9728) and `GET /.well-known/oauth-authorization-server` (RFC 8414) — discovery metadata.
- `POST /oauth/register` — Dynamic Client Registration (RFC 7591); supports public (PKCE) and confidential clients.
- `GET /oauth/authorize` — authorization-code flow with mandatory PKCE (S256). Unauthenticated users are bridged through the existing OIDC login and resumed afterward.
- `POST /oauth/token` — `authorization_code` and `refresh_token` grants. Access tokens are Linky JWTs scoped `mcp` with `aud` bound to the MCP resource (RFC 8707).
- `/mcp` — Streamable HTTP transport. The bearer token is validated by `MCPOAuthService.VerifyAccessToken` (signature, expiry, `mcp` scope, audience). The token's `user_id` is threaded into the existing services, which all enforce `WHERE user_id = ?`, so an authenticated user can only ever reach their own data. Tools: `list_links`, `search_links`, `get_link`, `create_link`, `update_link`, `delete_link`, `list_tags`, `rename_tag`, `delete_tag`, `set_tag_hierarchy`, `list_rss_updates`, `mark_rss_read`.

### Frontend (`client/`)

Vue 3 SPA with Composition API, TypeScript, Tailwind CSS v4, Pinia, Vue Router, Axios.

- `src/stores/` — Pinia stores: auth, links, tags, ui
- `src/api/client.ts` — Axios instance with Bearer token interceptor
- `src/composables/` — useSearch (client + server search), useRssPolling
- `src/views/` — Route-level pages
- `src/components/` — Organized by feature: layout/, links/, tags/, common/
- `src/types/index.ts` — All TypeScript interfaces

### Configuration

Server configured via environment variables. See `server/.env.example`. Key: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `PUBLIC_BASE_URL` (OAuth issuer/resource identifier for MCP — must match the externally reachable origin), OAuth provider `*_CLIENT_ID`/`*_CLIENT_SECRET` pairs.

### Data layer

MariaDB with tables: users, links, link_tags, tag_hierarchy, feed_updates, visitors, oauth_clients, oauth_auth_codes, oauth_refresh_tokens. Full-text search via MariaDB FULLTEXT indexes. Schema managed by embedded SQL migrations in `internal/database/migrations/`.

## Tech Stack

- Vue 3 / TypeScript / Tailwind CSS v4 / Pinia / Vite
- Go / chi / sqlx / golang-jwt / golang-migrate
- MariaDB 11
- OAuth 2.0 / OpenID Connect / OAuth 1.0a

## Old version

The previous Node.js/Express/CouchDB/React implementation is archived in `old-version/`.
