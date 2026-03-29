# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Linky

Linky is a bookmark manager with tagging, full-text search, and RSS feed tracking. It has a Vue 3 SPA frontend and a Go backend backed by MariaDB.

## Commands

### Go server (`server-go/`)

- `go run ./cmd/linky` — Start server on :8080 (auto-runs DB migrations)
- `go build ./cmd/linky` — Build production binary
- `go run ./cmd/migrate-couchdb` — Migrate data from CouchDB to MariaDB
- `docker-compose up -d mariadb` — Start MariaDB for local dev

### Vue client (`client/`)

- `npm run dev` — Vite dev server on :3000 (proxies API to :8080)
- `npm run build` — TypeScript check + production build to `dist/`
- `npx vue-tsc -b --noEmit` — TypeScript type check only

## Architecture

### Server (`server-go/`)

Go server using chi router, sqlx for database access, and embedded SQL migrations.

- `cmd/linky/main.go` — Entry point: config, DB, routing, SPA fallback
- `cmd/migrate-couchdb/main.go` — CouchDB → MariaDB migration CLI
- `internal/config/` — Environment-based config (`caarlos0/env`)
- `internal/database/` — MariaDB connection + golang-migrate with embedded SQL
- `internal/handler/` — HTTP handlers (auth, link, tag, rss, leave, oauth)
- `internal/middleware/` — JWT auth middleware, request logging
- `internal/model/` — Domain models with JSON tags matching client contract
- `internal/repository/` — Data access layer (sqlx queries)
- `internal/service/` — Business logic (link creation with URL resolution/title/favicon/system tags, tag hierarchy, RSS polling, OAuth flows)

### Frontend (`client/`)

Vue 3 SPA with Composition API, TypeScript, Tailwind CSS v4, Pinia, Vue Router, Axios.

- `src/stores/` — Pinia stores: auth, links, tags, ui
- `src/api/client.ts` — Axios instance with Bearer token interceptor
- `src/composables/` — useSearch (client + server search), useRssPolling
- `src/views/` — Route-level pages
- `src/components/` — Organized by feature: layout/, links/, tags/, common/
- `src/types/index.ts` — All TypeScript interfaces

### Configuration

Server configured via environment variables. See `server-go/.env.example`. Key: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, OAuth provider `*_CLIENT_ID`/`*_CLIENT_SECRET` pairs.

### Data layer

MariaDB with tables: users, links, link_tags, tag_hierarchy, feed_updates, visitors. Full-text search via MariaDB FULLTEXT indexes. Schema managed by embedded SQL migrations in `internal/database/migrations/`.

## Tech Stack

- Vue 3 / TypeScript / Tailwind CSS v4 / Pinia / Vite
- Go / chi / sqlx / golang-jwt / golang-migrate
- MariaDB 11
- OAuth 2.0 / OpenID Connect / OAuth 1.0a

## Old version

The previous Node.js/Express/CouchDB/React implementation is archived in `old-version/`.
