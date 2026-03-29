# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this

Vue 3 SPA frontend for Linky (bookmark manager). This is a full rewrite of the legacy React 15 frontend in the parent directory. It consumes the existing Express REST API — no server code lives here.

## Commands

- `npm run dev` — Vite dev server on :3000 (proxies API to Express on :8080)
- `npm run build` — TypeScript check + Vite production build to `dist/`
- `npx vue-tsc -b --noEmit` — TypeScript type check only

## Architecture

**Stack**: Vue 3 (Composition API, `<script setup>`) + TypeScript + Vite + Tailwind CSS v4 + Pinia + Vue Router + Axios

**Key directories**:
- `src/stores/` — Pinia stores: `auth` (JWT/login), `links` (CRUD/sort/RSS), `tags` (hierarchy), `ui` (toast messages)
- `src/api/client.ts` — Axios instance with Bearer token interceptor and 401 auto-redirect
- `src/composables/` — `useSearch` (dual-mode: client filter while typing, server search on Enter), `useRssPolling` (5-min interval)
- `src/views/` — Route-level pages
- `src/components/` — Organized by feature: `layout/`, `links/`, `tags/`, `common/`
- `src/types/index.ts` — All TypeScript interfaces (Link, TagNode, etc.)

**Auth flow**: JWT stored in localStorage, sent as `Authorization: Bearer` header. OAuth redirects to `/auth/:provider` (handled by Express), token picked up from cookie on return. Route guard in `router/index.ts` redirects unauthenticated users to login.

**Tailwind v4**: Uses `@tailwindcss/vite` plugin and `@import "tailwindcss"` in CSS (no `tailwind.config.js` — config is in `src/assets/main.css` via `@theme`).

## API dependency

All `/rest/*`, `/auth/*`, `/authback/*`, `/leave*`, `/archive/*` requests are proxied to `http://localhost:8080` in dev (configured in `vite.config.ts`). The Express server requires Node 16 and a running CouchDB — see parent directory's `run_couchdb.sh` and `CLAUDE.md`.
