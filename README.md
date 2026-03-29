# Linky

A bookmark manager with tagging, full-text search, and RSS feed tracking.

Installed at [https://linky1.com](https://linky1.com)

## Architecture

- **Frontend**: Vue 3 SPA (TypeScript, Tailwind CSS, Pinia) in `client/`
- **Backend**: Go server with MariaDB in `server/`
- **Auth**: JWT tokens, email/password, OAuth 2.0 (Google, GitHub, Facebook, LinkedIn, Bitbucket, Reddit, Yahoo), OAuth 1.0a (Twitter)

## Dev setup

### Prerequisites

- Go 1.24+
- Node.js 20+
- Docker (for MariaDB)

### Start MariaDB

```bash
cd server
docker-compose up -d mariadb
```

### Start the Go server

```bash
cd server
go run ./cmd/linky
```

The server runs on `:8080`, auto-runs database migrations on startup.

### Start the Vue dev server

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000 — API requests are proxied to the Go server on `:8080`.

## Configuration

The Go server is configured via environment variables. See `server/.env.example` for all options.

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `DATABASE_URL` | `linky:linky@tcp(localhost:3306)/linky?parseTime=true&multiStatements=true` | MariaDB DSN |
| `JWT_SECRET` | `change-me-in-production` | **Change in production!** |
| `JWT_EXPIRY` | `24h` | Token lifetime |
| `ENABLE_USERPASS` | `true` | Enable email/password auth |
| `ENABLE_OAUTH` | `true` | Enable OAuth login |

OAuth providers are configured via `<PROVIDER>_CLIENT_ID` and `<PROVIDER>_CLIENT_SECRET` env vars.

## Migration from CouchDB

To migrate data from an existing CouchDB instance:

```bash
cd server
go run ./cmd/migrate-couchdb \
  --couchdb-url=http://localhost:5984/linky \
  --couchdb-user=admin \
  --couchdb-password=secret
```

## Production

```bash
cd client
npm run build

cd ../server
go build -o linky ./cmd/linky
DATABASE_URL="..." JWT_SECRET="..." ./linky
```

The server serves the Vue client from `../client/dist/` if present.

Alternatively, use Docker:

```bash
cd server
docker-compose up
```

## Old version

The previous Node.js/Express/CouchDB/React implementation is archived in `old-version/`.
