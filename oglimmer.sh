#!/usr/bin/env bash

set -euo pipefail

# Define script metadata
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Default configuration
DEFAULT_REGISTRIES=("registry.oglimmer.com")
DEFAULT_CLIENT_DEPLOYMENT="linky-client"
DEFAULT_SERVER_DEPLOYMENT="linky-server"

# Configuration variables (can be overridden by parameters)
REGISTRIES=("${DEFAULT_REGISTRIES[@]}")
CLIENT_IMAGES=()
SERVER_IMAGES=()
CLIENT_DEPLOYMENT="$DEFAULT_CLIENT_DEPLOYMENT"
SERVER_DEPLOYMENT="$DEFAULT_SERVER_DEPLOYMENT"

# Directories
CLIENT_DIR="$SCRIPT_DIR/client"
SERVER_DIR="$SCRIPT_DIR/server"

# Default options (can be overridden by environment variables)
BUILD_CLIENT="${BUILD_CLIENT:-false}"
BUILD_SERVER="${BUILD_SERVER:-false}"
VERBOSE="${VERBOSE:-false}"
DRY_RUN="${DRY_RUN:-false}"
RESTART="${RESTART:-true}"
PUSH="${PUSH:-true}"
HELP=false
PLATFORM="${PLATFORM:-arm64}"
RELEASE_MODE=false
SHOW_VERSIONS=false
DEV_COMMAND=""
LOCAL_SUBCOMMAND=""
CM_SUBCOMMAND=""
CM_SUBARG=""

# Color output (only if terminal supports it)
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
  BOLD="$(tput bold)"
  GREEN="$(tput setaf 2)"
  YELLOW="$(tput setaf 3)"
  RED="$(tput setaf 1)"
  BLUE="$(tput setaf 4)"
  RESET="$(tput sgr0)"
else
  BOLD="" GREEN="" YELLOW="" RED="" BLUE="" RESET=""
fi

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${RESET} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${RESET} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${RESET} $1" >&2
}

# Verbose logging
log_verbose() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[VERBOSE]${RESET} $1"
    fi
}

# Execute command with dry-run and verbose support
execute_cmd() {
    local cmd="$1"

    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}[DRY-RUN]${RESET} ${cmd}"
        return 0
    else
        log_verbose "Executing: $cmd"
        if [[ "$VERBOSE" == true ]]; then
            eval "$cmd"
        else
            eval "$cmd" >/dev/null 2>&1
        fi
    fi
}

# Show usage information
show_help() {
    cat << EOF
Usage: ${SCRIPT_NAME} [OPTIONS] [COMMAND]

Build, deploy, and release Linky application components.

COMMANDS:
    build               Build and deploy components (default)
    release             Create a new release with version bumping and build
    show                Show current version
    firefox-ext         Build and sign the Firefox extension (.xpi)
    local <sub>         Run the Go server natively on this Mac (start|stop|
                        status|logs|test). See: ${SCRIPT_NAME} local help
    cm <sub>            Run the full stack (db+server+client) on the Apple
                        \`container\` machine. See: ${SCRIPT_NAME} cm help

BUILD OPTIONS:
    -c, --client            Build and deploy client only
    -s, --server            Build and deploy server only
    -a, --all               Build and deploy both client and server (default if no component specified)
    -v, --verbose           Enable verbose output
    -n, --no-restart        Skip Kubernetes deployment restart
    --no-push               Skip pushing images to registry
    --dry-run               Show what would be done without executing

    # Registry configuration options
    --registries "REG1,REG2"    Comma-separated list of registries to push to (default: ${DEFAULT_REGISTRIES[0]})
    --client-deploy NAME        Client deployment name (default: $DEFAULT_CLIENT_DEPLOYMENT)
    --server-deploy NAME        Server deployment name (default: $DEFAULT_SERVER_DEPLOYMENT)

    # Platform options
    --platform PLATFORM        Target platform(s) for Docker build:
                               - amd64: Build for AMD64/x86_64 architecture
                               - arm64: Build for ARM64 architecture
                               - multi: Build for both amd64 and arm64 (multi-platform)
                               - auto: Detect current platform automatically

    -h, --help              Show this help message

EXAMPLES:
    ${SCRIPT_NAME} build                                    # Build and deploy both components with defaults
    ${SCRIPT_NAME} build -c                                 # Build and deploy client only
    ${SCRIPT_NAME} build -s -v                              # Build and deploy server with verbose output
    ${SCRIPT_NAME} release                                  # Create a new release with version bump and build
    ${SCRIPT_NAME} show                                     # Show current version
    ${SCRIPT_NAME} build --registries my-registry.com       # Use custom registry
    ${SCRIPT_NAME} build --platform amd64                   # Build for AMD64 only
    ${SCRIPT_NAME} local start                              # Build and run server natively on this Mac
    ${SCRIPT_NAME} firefox-ext                               # Build and sign Firefox extension
    ${SCRIPT_NAME} cm up                                    # Run db+server+client on the container machine
    ${SCRIPT_NAME} cm status                                # Show stack status and URLs
    ${SCRIPT_NAME} cm logs server                           # Tail the in-machine server log

ENVIRONMENT VARIABLES:
    CLIENT_DEPLOYMENT       Override default client deployment name
    SERVER_DEPLOYMENT       Override default server deployment name
    PLATFORM                Override default platform (amd64|arm64|multi|auto)
    DEFAULT_REGISTRIES_ENV  Override default registries (comma-separated)
    VERBOSE                 Enable verbose mode (true/false)
    DRY_RUN                 Enable dry-run mode (true/false)
    PUSH                    Enable/disable pushing to registry (true/false)
    RESTART                 Enable/disable Kubernetes restart (true/false)

EOF
}

# Parse command line arguments
parse_args() {
    # Check if first argument is a command
    if [[ $# -gt 0 ]]; then
        case $1 in
            build)
                shift
                ;;
            release)
                RELEASE_MODE=true
                shift
                ;;
            show)
                SHOW_VERSIONS=true
                shift
                ;;
            local)
                DEV_COMMAND="local"
                LOCAL_SUBCOMMAND="${2:-help}"
                shift
                return
                ;;
            firefox-ext)
                DEV_COMMAND="firefox-ext"
                shift
                return
                ;;
            cm)
                DEV_COMMAND="cm"
                CM_SUBCOMMAND="${2:-help}"
                CM_SUBARG="${3:-}"
                shift
                return
                ;;
            help|-h|--help)
                HELP=true
                shift
                ;;
        esac
    fi

    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--client)
                BUILD_CLIENT=true
                shift
                ;;
            -s|--server)
                BUILD_SERVER=true
                shift
                ;;
            -a|--all)
                BUILD_CLIENT=true
                BUILD_SERVER=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -n|--no-restart)
                RESTART=false
                shift
                ;;
            --no-push)
                PUSH=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --registries)
                # Clear existing registries and parse comma-separated list
                REGISTRIES=()
                IFS=',' read -ra ADDR <<< "$2"
                for registry in "${ADDR[@]}"; do
                    REGISTRIES+=("$(echo "$registry" | xargs)")  # trim whitespace
                done
                shift 2
                ;;
            --client-deploy)
                CLIENT_DEPLOYMENT="$2"
                shift 2
                ;;
            --server-deploy)
                SERVER_DEPLOYMENT="$2"
                shift 2
                ;;
            --platform)
                PLATFORM="$2"
                shift 2
                ;;
            -h|--help)
                HELP=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Handle environment variable overrides
    CLIENT_DEPLOYMENT="${CLIENT_DEPLOYMENT:-$CLIENT_DEPLOYMENT}"
    SERVER_DEPLOYMENT="${SERVER_DEPLOYMENT:-$SERVER_DEPLOYMENT}"
    PLATFORM="${DOCKER_PLATFORM:-$PLATFORM}"

    # Override default registries from environment if set
    if [[ -n "${DEFAULT_REGISTRIES_ENV:-}" ]]; then
        REGISTRIES=()
        IFS=',' read -ra ADDR <<< "$DEFAULT_REGISTRIES_ENV"
        for registry in "${ADDR[@]}"; do
            REGISTRIES+=("$(echo "$registry" | xargs)")
        done
    fi

    # Build image arrays from registries
    if [[ ${#REGISTRIES[@]} -gt 0 ]]; then
        CLIENT_IMAGES=()
        SERVER_IMAGES=()
        for registry in "${REGISTRIES[@]}"; do
            CLIENT_IMAGES+=("$registry/linky-client")
            SERVER_IMAGES+=("$registry/linky-server")
        done
    else
        # Fallback to defaults if no registries specified
        CLIENT_IMAGES=("${DEFAULT_REGISTRIES[0]}/linky-client")
        SERVER_IMAGES=("${DEFAULT_REGISTRIES[0]}/linky-server")
    fi

    # Validate platform parameter
    if [[ -n "$PLATFORM" && ! "$PLATFORM" =~ ^(amd64|arm64|multi|auto)$ ]]; then
        log_error "Invalid platform: $PLATFORM. Must be one of: amd64, arm64, multi, auto"
        exit 1
    fi

    # Validate conflicting options
    if [[ "$PUSH" == false && "$RESTART" == true && "$RELEASE_MODE" == false ]]; then
        log_warning "Cannot restart deployments without pushing images. Setting --no-restart."
        RESTART=false
    fi

    # If no component specified for build mode, build both
    if [[ "$RELEASE_MODE" == false && "$SHOW_VERSIONS" == false && "$BUILD_CLIENT" == false && "$BUILD_SERVER" == false ]]; then
        BUILD_CLIENT=true
        BUILD_SERVER=true
    fi
}

# Check if required tools are available
check_prerequisites() {
    local tools=("docker" "kubectl")

    # Add additional tools for release mode
    if [[ "$RELEASE_MODE" == true ]]; then
        tools+=("npm" "git")
    fi

    local missing_deps=()
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_deps+=("$tool")
        fi
    done

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again." >&2
        exit 1
    fi

    # Check if Docker daemon is running (skip in dry-run mode)
    if [[ "$DRY_RUN" != true ]] && ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        echo "Please start Docker and try again." >&2
        exit 1
    fi

    # Check if buildx is available for multi-platform builds
    if [[ "$PLATFORM" == "multi" ]]; then
        if ! docker buildx version &> /dev/null; then
            log_error "Docker buildx is required for multi-platform builds but not available"
            log_info "Please install Docker Desktop or enable buildx plugin"
            exit 1
        fi

        # Ensure buildx builder is available
        if ! docker buildx inspect &> /dev/null; then
            log_info "Creating buildx builder instance..."
            docker buildx create --use --name multiplatform-builder 2>/dev/null || true
        fi
    fi

    log_verbose "All required tools are available"
}

# --- Local dev server commands ---

DEV_APP_NAME="linky"
DEV_PID_FILE="/tmp/${DEV_APP_NAME}.pid"
DEV_LOG_FILE="/tmp/${DEV_APP_NAME}.log"

# --- Container-machine (Apple `container`) run targets ---
# Runs the full stack against a running `container` machine:
#   db      -> a standalone mariadb container (own IP on the container network)
#   server  -> the Go binary, compiled & run *inside* the machine (:8080)
#   client  -> the Vite dev server, run *inside* the machine (:3000)
# The repo is mounted into the machine at the same path as on the host, so
# SERVER_DIR / CLIENT_DIR work verbatim inside it.
CM_MACHINE="${CM_MACHINE:-dev}"
CM_DB_CONTAINER="${CM_DB_CONTAINER:-linky-mariadb}"
CM_DB_IMAGE="${CM_DB_IMAGE:-mariadb:latest}"
CM_DB_VOLUME="${CM_DB_VOLUME:-linky-mariadb-data}"
CM_DB_NAME="${CM_DB_NAME:-linky}"
CM_DB_USER="${CM_DB_USER:-linky}"
CM_DB_PASS="${CM_DB_PASS:-linky}"
CM_DB_ROOT_PASS="${CM_DB_ROOT_PASS:-root}"
CM_SERVER_PORT="${CM_SERVER_PORT:-8080}"
CM_CLIENT_PORT="${CM_CLIENT_PORT:-3000}"
CM_GO_VERSION="${CM_GO_VERSION:-1.26.4}"
CM_SERVER_BIN="linky-linux-arm64"
CM_SERVER_PID="/tmp/linky-cm-server.pid"
CM_SERVER_LOG="/tmp/linky-cm-server.log"
CM_CLIENT_PID="/tmp/linky-cm-client.pid"
CM_CLIENT_LOG="/tmp/linky-cm-client.log"
CM_DEPS_MARKER="node_modules/.cm-linux-arm64-musl"

# Bundled dev IdP (navikt/mock-oauth2-server): a throwaway OIDC provider for
# local login. It uses a dynamic, Host-based issuer (so it needs no client or
# redirect-URI registration and survives changing container IPs) and accepts any
# client credentials. Used automatically UNLESS server/.env defines its own
# OIDC_ISSUER_URL (point that at a real IdP to override).
CM_IDP_CONTAINER="${CM_IDP_CONTAINER:-linky-idp}"
CM_IDP_IMAGE="${CM_IDP_IMAGE:-ghcr.io/navikt/mock-oauth2-server:2.1.10}"
CM_IDP_PORT="${CM_IDP_PORT:-8080}"          # port inside the idp container
CM_OIDC_CLIENT_ID="${CM_OIDC_CLIENT_ID:-linky}"
CM_OIDC_CLIENT_SECRET="${CM_OIDC_CLIENT_SECRET:-linky-dev-secret}"

# Load server .env if present
load_server_env() {
    if [[ -f "$SERVER_DIR/.env" ]]; then
        set -a
        source "$SERVER_DIR/.env"
        set +a
    fi
}

cmd_dev_start() {
    load_server_env
    if [[ -f "$DEV_PID_FILE" ]] && kill -0 "$(cat "$DEV_PID_FILE")" 2>/dev/null; then
        echo "already running (pid $(cat "$DEV_PID_FILE"))"
        return 1
    fi
    echo "building..."
    local version git_commit
    version=$(grep '"version"' "$CLIENT_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
    git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    (cd "$SERVER_DIR" && go build -ldflags "-X main.Version=${version} -X main.GitCommit=${git_commit}" -o "/tmp/${DEV_APP_NAME}" ./cmd/linky)
    echo "starting..."
    nohup "/tmp/${DEV_APP_NAME}" > "$DEV_LOG_FILE" 2>&1 &
    echo $! > "$DEV_PID_FILE"
    echo "started (pid $!, log: $DEV_LOG_FILE)"
}

cmd_dev_stop() {
    if [[ ! -f "$DEV_PID_FILE" ]]; then
        echo "not running"
        return 1
    fi
    local pid
    pid=$(cat "$DEV_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid"
        echo "stopped (pid $pid)"
    else
        echo "stale pid file (process $pid not running)"
    fi
    rm -f "$DEV_PID_FILE"
}

cmd_dev_status() {
    if [[ -f "$DEV_PID_FILE" ]] && kill -0 "$(cat "$DEV_PID_FILE")" 2>/dev/null; then
        echo "running (pid $(cat "$DEV_PID_FILE"))"
    else
        echo "not running"
        rm -f "$DEV_PID_FILE"
    fi
}

cmd_dev_logs() {
    if [[ -f "$DEV_LOG_FILE" ]]; then
        tail -f "$DEV_LOG_FILE"
    else
        echo "no log file found"
    fi
}

cmd_dev_test() {
    log_info "Running server tests..."
    (cd "$SERVER_DIR" && go test ./...)
}

# Build signed Firefox extension (.xpi) for internal distribution
cmd_firefox_ext() {
    local ext_dir="$SCRIPT_DIR/firefox-extension"

    if [[ ! -d "$ext_dir" ]]; then
        log_error "Firefox extension directory not found: $ext_dir"
        exit 1
    fi

    # Check for web-ext
    if ! command -v web-ext >/dev/null 2>&1; then
        log_error "web-ext is not installed. Install it with: npm install -g web-ext"
        exit 1
    fi

    # Check for required AMO credentials
    local api_key="${AMO_JWT_ISSUER:-}"
    local api_secret="${AMO_JWT_SECRET:-}"

    if [[ -z "$api_key" || -z "$api_secret" ]]; then
        log_error "AMO API credentials are required."
        echo
        echo "Set the following environment variables:"
        echo "  AMO_JWT_ISSUER   - Your AMO API key (JWT issuer)"
        echo "  AMO_JWT_SECRET   - Your AMO API secret"
        echo
        echo "Get your API keys at: https://addons.mozilla.org/developers/addon/api/key/"
        exit 1
    fi

    # Auto-increment patch version in manifest.json
    local old_version
    old_version=$(grep -o '"version": *"[^"]*"' "$ext_dir/manifest.json" | head -1 | cut -d'"' -f4)
    IFS='.' read -r major minor patch <<< "$old_version"
    patch=$((patch + 1))
    local version="$major.$minor.$patch"
    sed -i '' "s/\"version\": *\"$old_version\"/\"version\": \"$version\"/" "$ext_dir/manifest.json"

    echo -e "${BOLD}=== Firefox Extension Build ===${RESET}"
    echo "Version:    $old_version → $version"
    echo "Source:     $ext_dir"
    echo

    # Run esbuild first
    log_info "Building extension with esbuild..."
    (cd "$ext_dir" && npm run build)

    log_info "Signing extension with Mozilla Add-ons (unlisted)..."

    web-ext sign \
        --source-dir "$ext_dir" \
        --artifacts-dir "$ext_dir/web-ext-artifacts" \
        --api-key "$api_key" \
        --api-secret "$api_secret" \
        --channel unlisted \
        --ignore-files src node_modules esbuild.config.mjs package.json package-lock.json web-ext-artifacts .gitignore

    if [[ $? -eq 0 ]]; then
        echo
        log_success "Signed .xpi created in $ext_dir/web-ext-artifacts/"
        echo
        echo "To install: drag the .xpi file into Firefox or open about:addons and use 'Install Add-on From File'."
    else
        log_error "Failed to sign extension"
        exit 1
    fi
}

# --- Container-machine stack (db + server + client) ---
#
# NOTE: `container machine run ... sh -c '<script>'` mangles the script argument
# (you get "sh: -c requires an argument" / silently wrong results). Feeding the
# script on stdin via `-i sh -s` is reliable, so every in-machine command below
# goes through cm_exec / cm_exec_root.

# Run a script (read from stdin) inside the machine as the host user.
cm_exec() {
    container machine run -n "$CM_MACHINE" -i sh -s
}

# Run a script (read from stdin) inside the machine as root (for apk, /usr/local).
cm_exec_root() {
    container machine run -n "$CM_MACHINE" --root -i sh -s
}

# Ensure the `container` CLI exists and the machine is running (boots if needed).
cm_require() {
    if ! command -v container >/dev/null 2>&1; then
        log_error "'container' CLI not found. Install Apple's container tool first."
        exit 1
    fi
    if ! container machine ls 2>/dev/null | awk 'NR>1{print $1}' | grep -qx "$CM_MACHINE"; then
        log_error "container machine '$CM_MACHINE' not found."
        echo "Create one, e.g.:  container machine create alpine:latest --name $CM_MACHINE" >&2
        exit 1
    fi
    # `machine run` boots the machine if it is not already running.
    if ! container machine run -n "$CM_MACHINE" true >/dev/null 2>&1; then
        log_error "Could not start container machine '$CM_MACHINE'."
        exit 1
    fi
}

# IP of the machine on the container network (used to build reachable URLs).
cm_machine_ip() {
    container machine ls 2>/dev/null | awk -v m="$CM_MACHINE" '$1==m{print $4}' || true
}

# IP of the db container on the container network (reachable from the machine).
cm_db_ip() {
    container inspect "$CM_DB_CONTAINER" 2>/dev/null \
        | grep -m1 ipv4Address \
        | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' \
        | head -1 || true
}

# State of the db container: "running" | "stopped" | "" (does not exist).
cm_db_state() {
    container ls -a 2>/dev/null | awk -v c="$CM_DB_CONTAINER" '$1==c{print $5}' || true
}

cm_db_start() {
    local state; state="$(cm_db_state)"
    if [[ "$state" == "running" ]]; then
        log_info "DB already running ($CM_DB_CONTAINER)"
    elif [[ "$state" == "stopped" ]]; then
        log_info "Starting existing DB container ($CM_DB_CONTAINER)..."
        container start "$CM_DB_CONTAINER" >/dev/null
    else
        log_info "Creating DB container from $CM_DB_IMAGE..."
        container run -d --name "$CM_DB_CONTAINER" \
            -e MARIADB_ROOT_PASSWORD="$CM_DB_ROOT_PASS" \
            -e MARIADB_DATABASE="$CM_DB_NAME" \
            -e MARIADB_USER="$CM_DB_USER" \
            -e MARIADB_PASSWORD="$CM_DB_PASS" \
            -v "$CM_DB_VOLUME":/var/lib/mysql \
            "$CM_DB_IMAGE" >/dev/null
    fi

    log_info "Waiting for DB to accept connections..."
    local i
    for i in $(seq 1 60); do
        if container exec "$CM_DB_CONTAINER" \
            mariadb -u"$CM_DB_USER" -p"$CM_DB_PASS" "$CM_DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
            log_success "DB ready at $(cm_db_ip):3306"
            return 0
        fi
        sleep 1
    done
    log_error "DB did not become ready in time"
    return 1
}

cm_db_stop() {
    if [[ "$(cm_db_state)" == "running" ]]; then
        container stop "$CM_DB_CONTAINER" >/dev/null && log_success "DB stopped"
    else
        log_info "DB not running"
    fi
}

# --- Bundled dev IdP (mock-oauth2-server) ---

cm_idp_ip() {
    container inspect "$CM_IDP_CONTAINER" 2>/dev/null \
        | grep -m1 ipv4Address \
        | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' \
        | head -1 || true
}

cm_idp_state() {
    container ls -a 2>/dev/null | awk -v c="$CM_IDP_CONTAINER" '$1==c{print $5}' || true
}

# The OIDC issuer URL of the bundled IdP (empty until it is running).
cm_idp_issuer() {
    local ip; ip="$(cm_idp_ip)"
    [[ -n "$ip" ]] && echo "http://$ip:$CM_IDP_PORT/default"
}

# True when the user has configured their own OIDC provider in server/.env.
cm_user_oidc_configured() {
    [[ -f "$SERVER_DIR/.env" ]] && grep -qE '^[[:space:]]*OIDC_ISSUER_URL=[^[:space:]]' "$SERVER_DIR/.env"
}

cm_idp_start() {
    local state; state="$(cm_idp_state)"
    if [[ "$state" == "running" ]]; then
        log_info "Dev IdP already running ($CM_IDP_CONTAINER)"
    elif [[ "$state" == "stopped" ]]; then
        log_info "Starting existing dev IdP container ($CM_IDP_CONTAINER)..."
        container start "$CM_IDP_CONTAINER" >/dev/null
    else
        log_info "Creating dev IdP container from $CM_IDP_IMAGE..."
        container run -d --name "$CM_IDP_CONTAINER" \
            -e SERVER_PORT="$CM_IDP_PORT" \
            "$CM_IDP_IMAGE" >/dev/null
    fi

    # Wait until OIDC discovery responds — the backend panics if discovery fails
    # at startup, so the IdP must be ready before the server is launched.
    log_info "Waiting for dev IdP discovery..."
    local i ip
    for i in $(seq 1 60); do
        ip="$(cm_idp_ip)"
        if [[ -n "$ip" ]] && curl -fsS --max-time 3 \
            "http://$ip:$CM_IDP_PORT/default/.well-known/openid-configuration" >/dev/null 2>&1; then
            log_success "Dev IdP ready at http://$ip:$CM_IDP_PORT/default"
            return 0
        fi
        sleep 1
    done
    log_error "Dev IdP did not become ready in time"
    return 1
}

cm_idp_stop() {
    if [[ "$(cm_idp_state)" == "running" ]]; then
        container stop "$CM_IDP_CONTAINER" >/dev/null && log_success "Dev IdP stopped"
    else
        log_info "Dev IdP not running"
    fi
}

# Install the Go toolchain into the machine (one-time, persists in the machine).
cm_ensure_go() {
    if container machine run -n "$CM_MACHINE" /usr/local/go/bin/go version >/dev/null 2>&1; then
        return 0
    fi
    log_info "Installing Go ${CM_GO_VERSION} into machine..."
    cm_exec_root <<EOF
set -e
cd /tmp
wget -q https://go.dev/dl/go${CM_GO_VERSION}.linux-arm64.tar.gz -O go.tgz
rm -rf /usr/local/go
tar -C /usr/local -xzf go.tgz
rm go.tgz
/usr/local/go/bin/go version
EOF
}

# Install Node.js + npm into the machine (one-time).
cm_ensure_node() {
    if container machine run -n "$CM_MACHINE" node --version >/dev/null 2>&1; then
        return 0
    fi
    log_info "Installing Node.js + npm into machine..."
    cm_exec_root <<'EOF'
set -e
/sbin/apk update >/dev/null
/sbin/apk add --no-cache nodejs npm
node --version
EOF
}

# Install client deps inside the machine (linux/musl native binaries).
# This replaces a host (darwin) node_modules; restore on macOS with `npm install`.
# A marker file lets us skip reinstalling when the platform hasn't changed.
cm_ensure_client_deps() {
    cm_ensure_node
    if cm_exec >/dev/null 2>&1 <<EOF
[ -f $CLIENT_DIR/$CM_DEPS_MARKER ]
EOF
    then
        return 0
    fi
    log_warning "Installing client deps in machine (replaces host node_modules; 'npm install' on macOS to restore)..."
    cm_exec <<EOF
set -e
cd $CLIENT_DIR
npm ci
touch $CM_DEPS_MARKER
EOF
    log_success "Client dependencies installed"
}

# Compile the Go server inside the machine.
cm_build() {
    cm_ensure_go
    local version git_commit
    version=$(grep '"version"' "$CLIENT_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
    git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    log_info "Compiling server in machine (version=$version commit=$git_commit)..."
    cm_exec <<EOF
set -e
export PATH=/usr/local/go/bin:\$PATH
export GOCACHE=/tmp/go-build GOMODCACHE=/tmp/go-mod GOFLAGS=-buildvcs=false
cd $SERVER_DIR
go build -ldflags "-X main.Version=$version -X main.GitCommit=$git_commit" -o $CM_SERVER_BIN ./cmd/linky
EOF
    log_success "Server compiled: $SERVER_DIR/$CM_SERVER_BIN"
}

# Print how to log in, depending on whether the bundled dev IdP or a user-
# configured OIDC provider is in effect.
cm_login_hint() {
    local mip; mip="$(cm_machine_ip)"
    if cm_user_oidc_configured; then
        log_info "Login: SSO via your OIDC provider from $SERVER_DIR/.env"
        log_info "  Register this redirect URI there: http://$mip:$CM_CLIENT_PORT/authback/oidc"
    else
        log_info "Login: open the app, click 'Sign in with SSO', then on the dev IdP"
        log_info "  page enter ANY username and submit (no password, no registration)."
    fi
}

cm_server_start() {
    cm_db_start
    local db_ip mip app_origin idp_issuer=""
    db_ip="$(cm_db_ip)"; mip="$(cm_machine_ip)"; app_origin="http://$mip:$CM_CLIENT_PORT"
    if [[ -z "$db_ip" ]]; then
        log_error "Could not resolve DB container IP"
        return 1
    fi

    # Pick the OIDC provider: user's own (server/.env) or the bundled dev IdP.
    # The backend does OIDC discovery at startup and PANICS if it fails, so the
    # dev IdP must be up and discovery-ready before we launch the server.
    if cm_user_oidc_configured; then
        log_info "Using OIDC provider from $SERVER_DIR/.env"
    else
        cm_idp_start
        idp_issuer="$(cm_idp_issuer)"
        if [[ -z "$idp_issuer" ]]; then
            log_error "Could not resolve dev IdP issuer URL"
            return 1
        fi
    fi

    # Build the binary if it is missing.
    if ! cm_exec >/dev/null 2>&1 <<EOF
[ -x $SERVER_DIR/$CM_SERVER_BIN ]
EOF
    then
        cm_build
    fi
    log_info "Starting server (DB=$db_ip, listen :$CM_SERVER_PORT)..."
    # The user-facing origin in dev is the Vite server (:$CM_CLIENT_PORT), which
    # proxies /auth + /authback to this backend. Route the SSO flow through it
    # (OAUTH_REDIRECT_BASE -> Vite) so login uses the current Vite frontend and
    # the post-login redirect lands there. Values in server/.env win if present.
    cm_exec <<EOF
[ -f $CM_SERVER_PID ] && kill \$(cat $CM_SERVER_PID) 2>/dev/null || true
sleep 1
set -a
[ -f $SERVER_DIR/.env ] && . $SERVER_DIR/.env
set +a
export PORT=$CM_SERVER_PORT
export DATABASE_URL="$CM_DB_USER:$CM_DB_PASS@tcp($db_ip:3306)/$CM_DB_NAME?parseTime=true&multiStatements=true"
: "\${OAUTH_REDIRECT_BASE:=$app_origin/authback}"; export OAUTH_REDIRECT_BASE
: "\${PUBLIC_BASE_URL:=http://$mip:$CM_SERVER_PORT}"; export PUBLIC_BASE_URL
: "\${OIDC_ISSUER_URL:=$idp_issuer}"; export OIDC_ISSUER_URL
: "\${OIDC_CLIENT_ID:=$CM_OIDC_CLIENT_ID}"; export OIDC_CLIENT_ID
: "\${OIDC_CLIENT_SECRET:=$CM_OIDC_CLIENT_SECRET}"; export OIDC_CLIENT_SECRET
export COOKIE_SECURE=false
: "\${JWT_SECRET:=dev-secret}"; export JWT_SECRET
: "\${JWT_EXPIRY:=24h}"; export JWT_EXPIRY
# Run from the repo root so the server's relative "../client/dist" lookup does
# NOT resolve: in the cm workflow the frontend is Vite on :$CM_CLIENT_PORT, and
# the Go server must not serve a stale built SPA on :$CM_SERVER_PORT.
cd $SCRIPT_DIR
setsid sh -c '$SERVER_DIR/$CM_SERVER_BIN >$CM_SERVER_LOG 2>&1 & echo \$! >$CM_SERVER_PID' </dev/null >/dev/null 2>&1
sleep 3
if kill -0 \$(cat $CM_SERVER_PID) 2>/dev/null; then
    echo "server pid \$(cat $CM_SERVER_PID)"
else
    echo "server failed to start:"; cat $CM_SERVER_LOG; exit 1
fi
EOF
    log_success "API:      http://$mip:$CM_SERVER_PORT  (API/MCP only — not the UI)"
    cm_login_hint
}

cm_server_stop() {
    cm_exec <<EOF
if [ -f $CM_SERVER_PID ] && kill -0 \$(cat $CM_SERVER_PID) 2>/dev/null; then
    kill \$(cat $CM_SERVER_PID) && echo "server stopped"
else
    echo "server not running"
fi
rm -f $CM_SERVER_PID
EOF
}

cm_client_start() {
    cm_ensure_client_deps
    local mip; mip="$(cm_machine_ip)"
    log_info "Starting Vite dev server (listen :$CM_CLIENT_PORT)..."
    # Run vite directly via node so the tracked PID is vite itself (clean stop).
    cm_exec <<EOF
[ -f $CM_CLIENT_PID ] && kill \$(cat $CM_CLIENT_PID) 2>/dev/null || true
sleep 1
cd $CLIENT_DIR
setsid sh -c 'node node_modules/vite/bin/vite.js --host 0.0.0.0 --port $CM_CLIENT_PORT >$CM_CLIENT_LOG 2>&1 & echo \$! >$CM_CLIENT_PID' </dev/null >/dev/null 2>&1
sleep 4
if kill -0 \$(cat $CM_CLIENT_PID) 2>/dev/null; then
    echo "client pid \$(cat $CM_CLIENT_PID)"
else
    echo "client failed to start:"; cat $CM_CLIENT_LOG; exit 1
fi
EOF
    log_success "App:      http://$mip:$CM_CLIENT_PORT  <- open this in your browser"
}

cm_client_stop() {
    cm_exec <<EOF
if [ -f $CM_CLIENT_PID ] && kill -0 \$(cat $CM_CLIENT_PID) 2>/dev/null; then
    kill \$(cat $CM_CLIENT_PID) && echo "client stopped"
else
    echo "client not running"
fi
rm -f $CM_CLIENT_PID
EOF
}

cm_up() {
    cm_db_start
    cm_build
    cm_server_start
    cm_client_start
    echo
    cm_status
    echo
    log_success "Open the app at  http://$(cm_machine_ip):$CM_CLIENT_PORT  (sign in via SSO there)."
    log_info "Do NOT use :$CM_SERVER_PORT in the browser — it is the API only."
}

cm_down() {
    cm_client_stop
    cm_server_stop
    cm_idp_stop
    cm_db_stop
}

cm_status() {
    local mip db_ip db_state idp_state idp_ip
    mip="$(cm_machine_ip)"; db_ip="$(cm_db_ip)"; db_state="$(cm_db_state)"
    idp_state="$(cm_idp_state)"; idp_ip="$(cm_idp_ip)"
    echo -e "${BOLD}=== Container-machine stack ===${RESET}"
    echo "Machine '$CM_MACHINE': $(container machine ls 2>/dev/null | awk -v m="$CM_MACHINE" '$1==m{print $8" ("$4")"}')"
    echo "DB ($CM_DB_CONTAINER): ${db_state:-not created}${db_ip:+ @ $db_ip:3306}"
    if cm_user_oidc_configured; then
        echo "IdP: using OIDC from $SERVER_DIR/.env"
    else
        echo "IdP ($CM_IDP_CONTAINER): ${idp_state:-not created}${idp_ip:+ @ http://$idp_ip:$CM_IDP_PORT/default}"
    fi
    cm_exec <<EOF
if [ -f $CM_SERVER_PID ] && kill -0 \$(cat $CM_SERVER_PID) 2>/dev/null; then
    echo "API (server): running (pid \$(cat $CM_SERVER_PID)) -> http://$mip:$CM_SERVER_PORT"
else
    echo "API (server): stopped"
fi
if [ -f $CM_CLIENT_PID ] && kill -0 \$(cat $CM_CLIENT_PID) 2>/dev/null; then
    echo "App (client): running (pid \$(cat $CM_CLIENT_PID)) -> http://$mip:$CM_CLIENT_PORT  <- open this"
else
    echo "App (client): stopped"
fi
EOF
}

cm_logs() {
    local what="${1:-}"
    case "$what" in
        server)
            container machine run -n "$CM_MACHINE" -i sh -s <<EOF
tail -n 200 -f $CM_SERVER_LOG
EOF
            ;;
        client)
            container machine run -n "$CM_MACHINE" -i sh -s <<EOF
tail -n 200 -f $CM_CLIENT_LOG
EOF
            ;;
        db)
            container logs -f -n 200 "$CM_DB_CONTAINER"
            ;;
        *)
            log_error "usage: ${SCRIPT_NAME} cm logs <server|client|db>"
            exit 1
            ;;
    esac
}

cm_help() {
    cat << EOF
Usage: ${SCRIPT_NAME} cm <subcommand>

Run the full Linky stack on the Apple \`container\` machine '${CM_MACHINE}':
  db     - standalone mariadb container
  idp    - bundled dev OIDC provider (mock-oauth2-server) for local login
  server - Go binary compiled & run inside the machine (:${CM_SERVER_PORT})
  client - Vite dev server run inside the machine (:${CM_CLIENT_PORT})

SUBCOMMANDS:
  up             Start everything (db + build + server + client), then status
  down           Stop client, server and db
  restart        down + up
  status         Show state and reachable URLs
  logs <c>       Tail logs for: server | client | db   (Ctrl-C to exit)
  build          Compile the server inside the machine
  provision      Install Go, Node and client deps in the machine (one-time)
  help-details   Show the raw commands to bring up all 3 components manually
  db-start / db-stop
  idp-start / idp-stop
  server-start / server-stop
  client-start / client-stop

ENVIRONMENT OVERRIDES:
  CM_MACHINE (=${CM_MACHINE})  CM_DB_IMAGE (=${CM_DB_IMAGE})
  CM_SERVER_PORT (=${CM_SERVER_PORT})  CM_CLIENT_PORT (=${CM_CLIENT_PORT})  CM_GO_VERSION (=${CM_GO_VERSION})

NOTES:
  - Open the app on the CLIENT port (:${CM_CLIENT_PORT}, Vite). The server port
    (:${CM_SERVER_PORT}) is the API/MCP only — opening it in a browser is wrong.
  - Login is SSO-only. By default a throwaway dev IdP (mock-oauth2-server) is
    started and wired up automatically — just click 'Sign in with SSO' and enter
    any username (no password). To use a real IdP instead, set OIDC_ISSUER_URL /
    OIDC_CLIENT_ID / OIDC_CLIENT_SECRET in ${SERVER_DIR}/.env; the SSO flow is
    routed through Vite, so register redirect URI
    http://<machine-ip>:${CM_CLIENT_PORT}/authback/oidc there.
  - Machine and DB IPs are resolved at runtime (they change across reboots).
  - 'cm up' provisions the machine automatically on first run.
  - Installing client deps replaces a macOS node_modules; run 'npm install'
    on the host to restore native macOS dev.
EOF
}

cm_help_details() {
    cat << EOF
Manual bring-up of all 3 components (what 'cm up' automates).
Commands are flush-left so you can copy-paste them as-is.

One-time: install Go, Node and client deps in the machine:

${SCRIPT_NAME} cm provision


# 1) Database — a mariadb container

container run -d --name ${CM_DB_CONTAINER} \\
  -e MARIADB_ROOT_PASSWORD=${CM_DB_ROOT_PASS} \\
  -e MARIADB_DATABASE=${CM_DB_NAME} \\
  -e MARIADB_USER=${CM_DB_USER} \\
  -e MARIADB_PASSWORD=${CM_DB_PASS} \\
  -v ${CM_DB_VOLUME}:/var/lib/mysql \\
  ${CM_DB_IMAGE}

# then note its IP (the address column):
container ls


# 2) Backend — Go server inside the machine (replace DB_IP with the IP from step 1)

container machine run -n ${CM_MACHINE} -i sh -s <<'SH'
cd ${SERVER_DIR}
/usr/local/go/bin/go build -buildvcs=false -o ${CM_SERVER_BIN} ./cmd/linky
PORT=${CM_SERVER_PORT} \\
DATABASE_URL='${CM_DB_USER}:${CM_DB_PASS}@tcp(DB_IP:3306)/${CM_DB_NAME}?parseTime=true&multiStatements=true' \\
JWT_SECRET=dev-secret \\
./${CM_SERVER_BIN}
SH


# 3) Frontend — Vite dev server inside the machine

container machine run -n ${CM_MACHINE} -i sh -s <<'SH'
cd ${CLIENT_DIR}
npm run dev -- --host 0.0.0.0 --port ${CM_CLIENT_PORT}
SH


# Open the app at  http://MACHINE_IP:${CM_CLIENT_PORT}   (MACHINE_IP = IP column of: container machine ls)

Notes:
  - Run steps 2 and 3 in separate terminals; both stay in the foreground.
  - In-machine commands use '-i sh -s' with the script on stdin;
    "sh -c '<script>'" does not work reliably with 'container machine run'.
EOF
}

cmd_cm() {
    local sub="${1:-help}" arg="${2:-}"
    case "$sub" in
        help|"")      cm_help; return ;;
        help-details) cm_help_details; return ;;
    esac
    cm_require
    case "$sub" in
        up)           cm_up ;;
        down)         cm_down ;;
        restart)      cm_down; cm_up ;;
        status)       cm_status ;;
        logs)         cm_logs "$arg" ;;
        build)        cm_build ;;
        provision)    cm_ensure_go; cm_ensure_client_deps ;;
        db-start)     cm_db_start ;;
        db-stop)      cm_db_stop ;;
        idp-start)    cm_idp_start ;;
        idp-stop)     cm_idp_stop ;;
        server-start) cm_server_start ;;
        server-stop)  cm_server_stop ;;
        client-start) cm_client_start ;;
        client-stop)  cm_client_stop ;;
        *)
            log_error "Unknown cm subcommand: $sub"
            cm_help
            exit 1
            ;;
    esac
}

local_help() {
    cat << EOF
Usage: ${SCRIPT_NAME} local <subcommand>

Run the Go server natively on this Mac (local dev, server only).

SUBCOMMANDS:
  start    Build and run the server in the background (pid: ${DEV_PID_FILE})
  stop     Stop the local server process
  status   Show whether the local server is running
  logs     Tail the local server log file (${DEV_LOG_FILE})
  test     Run server tests (go test ./...)
EOF
}

cmd_local() {
    local sub="${1:-help}"
    case "$sub" in
        start)   cmd_dev_start ;;
        stop)    cmd_dev_stop ;;
        status)  cmd_dev_status ;;
        logs)    cmd_dev_logs ;;
        test)    cmd_dev_test ;;
        help|"") local_help ;;
        *)
            log_error "Unknown local subcommand: $sub"
            local_help
            exit 1
            ;;
    esac
}

execute_dev_command() {
    case "$DEV_COMMAND" in
        local)       cmd_local "$LOCAL_SUBCOMMAND" ;;
        firefox-ext) cmd_firefox_ext ;;
        cm)          cmd_cm "$CM_SUBCOMMAND" "$CM_SUBARG" ;;
    esac
}

# Show current versions
show_versions() {
    local version
    version=$(grep '"version"' "$CLIENT_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')

    echo "Version: $version"
}

# Bump semantic version
bump_version() {
    local current_version="$1"
    local bump_type="$2"
    IFS='.' read -r major minor patch <<< "$current_version"

    case "$bump_type" in
        major)
            major=$((major + 1)); minor=0; patch=0;
            ;;
        minor)
            minor=$((minor + 1)); patch=0;
            ;;
        bugfix|patch)
            patch=$((patch + 1));
            ;;
        *)
            echo "Unknown bump type: $bump_type" >&2
            exit 1
            ;;
    esac
    echo "$major.$minor.$patch"
}

# Get platform arguments for docker build
get_platform_args() {
    local platform_args=""

    case "$PLATFORM" in
        "amd64")
            platform_args="--platform linux/amd64"
            ;;
        "arm64")
            platform_args="--platform linux/arm64"
            ;;
        "multi")
            platform_args="--platform linux/amd64,linux/arm64"
            ;;
        "auto"|"")
            # Let Docker detect the platform automatically
            platform_args=""
            ;;
    esac

    echo "$platform_args"
}

# Build Docker image for multiple targets
build_image() {
    local component="$1"
    local dockerfile_args="$2"
    local platform_args=$(get_platform_args)

    # Create array of image tags - passed as remaining arguments
    shift 2
    local image_tags=("$@")
    local primary_tag="${image_tags[0]}"

    log_info "Building $component image for ${#image_tags[@]} target(s):"
    for tag in "${image_tags[@]}"; do
        log_info "  - $tag"
    done
    if [[ -n "$platform_args" ]]; then
        log_info "Target platform(s): $PLATFORM"
    fi

    local build_cmd=""

    # Use buildx for multi-platform builds or when platform is specified
    if [[ "$PLATFORM" == "multi" || (-n "$PLATFORM" && "$PLATFORM" != "auto") ]]; then
        build_cmd="docker buildx build $platform_args"

        # Add all tags
        for tag in "${image_tags[@]}"; do
            build_cmd="$build_cmd --tag $tag"
        done

        if [[ "$PUSH" == true ]]; then
            build_cmd="$build_cmd --push"
        else
            # For local builds with buildx, we need to load the image
            if [[ "$PLATFORM" != "multi" ]]; then
                build_cmd="$build_cmd --load"
            else
                log_warning "Multi-platform builds cannot be loaded locally, forcing push to registry"
                build_cmd="$build_cmd --push"
            fi
        fi

        # Add dockerfile arguments
        build_cmd="$build_cmd $dockerfile_args"

    else
        # Use regular docker build for single platform or auto-detection
        # Build with primary tag first
        build_cmd="docker build $platform_args --tag $primary_tag $dockerfile_args"

        # Tag for additional registries
        if [[ ${#image_tags[@]} -gt 1 ]]; then
            for tag in "${image_tags[@]:1}"; do
                build_cmd="$build_cmd && docker tag $primary_tag $tag"
            done
        fi

        # Push to all registries if requested
        if [[ "$PUSH" == true ]]; then
            for tag in "${image_tags[@]}"; do
                build_cmd="$build_cmd && docker push $tag"
            done
        fi
    fi

    log_verbose "Build command: $build_cmd"

    if execute_cmd "$build_cmd"; then
        log_success "$component image built successfully"
        if [[ "$PUSH" == false && "$PLATFORM" != "multi" ]]; then
            log_info "$component image tagged locally (not pushed)"
        elif [[ "$PUSH" == true ]]; then
            log_success "$component image pushed to ${#image_tags[@]} target(s)"
        fi
    else
        log_error "Failed to build $component image"
        exit 1
    fi
}

# Restart Kubernetes deployment
restart_deployment() {
    local deployment="$1"

    log_info "Restarting deployment: $deployment"

    if execute_cmd "kubectl rollout restart deployment/$deployment"; then
        log_success "Deployment $deployment restarted successfully"

        # Wait for rollout to complete if verbose
        if [[ "$VERBOSE" == true ]]; then
            log_info "Waiting for rollout to complete..."
            kubectl rollout status deployment/"$deployment" --timeout=300s
        fi
    else
        log_error "Failed to restart deployment: $deployment"
        exit 1
    fi
}

# Execute build process
execute_build() {
    # Display configuration
    echo -e "${BOLD}=== Build Configuration ===${RESET}"
    echo "Registries:        ${REGISTRIES[*]}"
    echo "Platform:          ${PLATFORM:-auto}"
    echo "Build Client:      $BUILD_CLIENT"
    echo "Build Server:      $BUILD_SERVER"
    echo "Push to Registry:  $PUSH"
    echo "Restart K8s:       $RESTART"
    echo "Dry-run:           $DRY_RUN"
    echo "Verbose:           $VERBOSE"
    if [[ "$BUILD_CLIENT" == true ]]; then
        echo "Client Deploy:     $CLIENT_DEPLOYMENT"
    fi
    if [[ "$BUILD_SERVER" == true ]]; then
        echo "Server Deploy:     $SERVER_DEPLOYMENT"
    fi
    echo -e "${BOLD}===========================${RESET}"
    echo

    log_info "Starting build process..."

    local app_version git_commit
    app_version=$(grep '"version"' "$CLIENT_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
    git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    # Build client
    if [[ "$BUILD_CLIENT" == true ]]; then
        build_image "client" "--build-arg VITE_APP_VERSION=${app_version} --build-arg VITE_GIT_COMMIT=${git_commit} client/" "${CLIENT_IMAGES[@]}"
    fi

    # Build server
    if [[ "$BUILD_SERVER" == true ]]; then
        build_image "server" "--build-arg VERSION=${app_version} --build-arg GIT_COMMIT=${git_commit} server/" "${SERVER_IMAGES[@]}"
    fi

    # Restart deployments if requested
    if [[ "$RESTART" == true ]]; then
        if [[ "$BUILD_CLIENT" == true ]]; then
            restart_deployment "$CLIENT_DEPLOYMENT"
        fi

        if [[ "$BUILD_SERVER" == true ]]; then
            restart_deployment "$SERVER_DEPLOYMENT"
        fi
    else
        log_info "Skipping deployment restarts (--no-restart specified)"
    fi

    echo
    echo -e "${BOLD}${GREEN}All operations completed successfully${RESET}"
}

# Execute release process
execute_release() {
    log_info "Starting release process..."

    # Show current versions
    echo "Current version:"; show_versions; echo

    # Explain bump types
    echo "Select which part to bump (semantic versioning):"
    echo "  1) major  - incompatible API changes"
    echo "  2) minor  - backwards-compatible new features"
    echo "  3) bugfix - backwards-compatible bug fixes"
    PS3="Enter choice (1-3): "
    select bump in major minor bugfix; do
        if [[ -n "$bump" ]]; then
            echo "Chosen bump type: $bump"; break
        else
            echo "Invalid choice. Please select 1, 2, or 3.";
        fi
    done

    # Compute new version from client package.json
    local current_version
    current_version=$(grep '"version"' "$CLIENT_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
    local new_version
    new_version=$(bump_version "$current_version" "$bump")
    log_info "Releasing version $new_version..."

    # Update client version
    log_info "Updating client version to $new_version..."
    (cd "$CLIENT_DIR" && npm version "$new_version" --no-git-tag-version)

    # Commit and tag release
    log_info "Committing version changes and creating tag..."
    git add "$CLIENT_DIR/package.json" "$CLIENT_DIR/package-lock.json"
    git commit -m "Release v$new_version"
    git tag -a "v$new_version" -m "Release v$new_version"

    # Build and upload after version commit
    log_info "Building and uploading release version $new_version..."
    BUILD_CLIENT=true
    BUILD_SERVER=true
    execute_build

    log_success "Release v$new_version complete."
}

# Main execution function
main() {
    # Show help if no arguments provided
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi

    parse_args "$@"

    if [[ "$HELP" == true ]]; then
        show_help
        exit 0
    fi

    if [[ "$SHOW_VERSIONS" == true ]]; then
        show_versions
        exit 0
    fi

    if [[ -n "$DEV_COMMAND" ]]; then
        execute_dev_command
        exit 0
    fi

    check_prerequisites

    if [[ "$RELEASE_MODE" == true ]]; then
        execute_release
    else
        execute_build
    fi
}

# Run main function with all arguments
main "$@"
