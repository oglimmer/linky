#!/usr/bin/env bash
#
# Generates sealed secret values for the Linky Helm chart.
#
# Prerequisites:
#   1. Install sealed-secrets controller on your cluster:
#      helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
#      helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system
#
#   2. Install kubeseal CLI:
#      brew install kubeseal
#
# Usage:
#   ./seal-secrets.sh [namespace] [release-name]
#   # Outputs: sealed-values.yaml (add to helm install -f)

set -euo pipefail

NAMESPACE="${1:-default}"
RELEASE="${2:-linky}"
SECRET_NAME="${RELEASE}-secret"
OUTPUT_FILE="sealed-values.yaml"

# --- Load secrets from .env file ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: ${ENV_FILE} not found. Copy .env.example to .env and fill in your secrets."
  exit 1
fi
set -a
source "$ENV_FILE"
set +a

JWT_SECRET="$(openssl rand -base64 32)"
# --- End load section ---

echo "Creating plain secret and sealing..."

# Build the kubectl create secret command dynamically
SECRET_ARGS=(
  "DATABASE_URL=${DATABASE_URL}"
  "JWT_SECRET=${JWT_SECRET}"
  "JWT_EXPIRY=${JWT_EXPIRY}"
)

# Add OAuth vars only if set
for var in CONTENT_API_URL CONTENT_API_USER CONTENT_API_PASS \
           OIDC_ISSUER_URL OIDC_CLIENT_ID OIDC_CLIENT_SECRET; do
  val="${!var:-}"
  if [ -n "$val" ]; then
    SECRET_ARGS+=("${var}=${val}")
  fi
done

FROM_LITERAL_ARGS=()
for arg in "${SECRET_ARGS[@]}"; do
  FROM_LITERAL_ARGS+=("--from-literal=${arg}")
done

# Create the plain secret, pipe to kubeseal, extract encrypted values
SEALED_JSON=$(kubectl create secret generic "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o json \
  "${FROM_LITERAL_ARGS[@]}" | \
  kubeseal --format json --namespace="$NAMESPACE")

# Extract encryptedData and write as Helm values
echo "sealedSecret:" > "$OUTPUT_FILE"
echo "$SEALED_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for key, val in data['spec']['encryptedData'].items():
    print(f'  {key}: \"{val}\"')
" >> "$OUTPUT_FILE"

echo "Sealed values written to ${OUTPUT_FILE}"
echo ""
echo "Install with:"
echo "  helm install linky ./helm/linky -f helm/linky/${OUTPUT_FILE}"
