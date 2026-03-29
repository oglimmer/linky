# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Linky

Linky is a bookmark manager with tagging, full-text search, and web archiving. It's an isomorphic (universal) React+Express app backed by CouchDB.

## Commands

- `npm run dev` — Start dev server with webpack HMR on :8080
- `npm run nodemon` — Dev server with nodemon watching `server/`
- `npm start` — Production server (requires NODE_ENV=production)
- `npm run build` — Webpack production bundle to `dist/`
- `npm test` — ESLint (server, src, link-check-server) + Jest unit tests
- `npm integrationtest` — Integration tests (requires running CouchDB)
- Run a single test: `npx jest tests/client-unit/ArrayUtil.test.js`

CouchDB for local dev: `docker-compose up` (starts CouchDB 3.1 + Clouseau search indexer).

## Architecture

**Isomorphic rendering**: Express server renders React components server-side, serializes Redux state to `window.$REDUX_STATE`, and the client hydrates from that state.

**Server** (`server/`):
- `index.js` — Express entry point: security headers (CSP, HSTS, XSS), logging (Winston+Morgan), webpack-dev-middleware in dev mode, server-side React rendering
- `httpRoutes/` — REST route handlers (auth, link, tag, user, archive, rss)
- `controller/` — Business logic layer
- `dao/` — CouchDB data access via `nano` client (NanoConnection.js manages connection)
- `auth/` — OAuth 1.0a (Twitter), OAuth 2.0 (Google, GitHub, Facebook, etc.), OpenID Connect

**Frontend** (`src/`):
- Redux with redux-thunk for async actions, react-redux-form for forms
- `redux/actions/` → `redux/reducers/` → connected `components/`
- `pages/` — Route-level page components
- `routes/` — React Router configuration
- State uses Immutable.js, serialized/deserialized between server and client

**Configuration**: `RUNCFG` env var controls server mode (`DEV`, `DEV-WEB`, `DEV-REST`, `PROD`, `PROD-REST`, `PROD-STATIC`, `PROD-PAGE-GEN`). Properties loaded from file path in `LINKY_PROPERTIES` env var, defaults in `server/util/linky_default.properties`.

**Data layer**: CouchDB with design documents in `build/couchdb/`. Full-text search via Clouseau (Java-based Lucene indexer). Archive system stores scraped pages in separate `linky_archive` database.

## Tech Stack

- React 15 / Redux / React Router 3 / Bootstrap 3
- Express.js with Babel transpilation (es2015–es2017, stage-0)
- Webpack (separate dev/prod configs in `build/`)
- ESLint with Airbnb config, Jest for testing
- CouchDB 3.x + Clouseau for search
