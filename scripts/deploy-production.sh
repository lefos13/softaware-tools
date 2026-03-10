#!/usr/bin/env bash
: <<'COMMENT'
Builds the Vite frontend from .env.production and publishes the generated
static files into the configured target directory, using rsync when available
so old assets do not remain after a deploy.
COMMENT

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing production env file: $ENV_FILE" >&2
  echo "Copy .env.production.example to .env.production and fill in real values." >&2
  exit 1
fi

cd "$ROOT_DIR"

set -a
source "$ENV_FILE"
set +a

TARGET_DIR="${DEPLOY_TARGET_DIR:-}"

if [[ -z "$TARGET_DIR" ]]; then
  echo "DEPLOY_TARGET_DIR must be set in .env.production." >&2
  exit 1
fi

HUSKY=0 npm ci
npm run build
mkdir -p "$TARGET_DIR"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$ROOT_DIR/dist/" "$TARGET_DIR/"
else
  cp -R "$ROOT_DIR/dist/." "$TARGET_DIR/"
fi

echo "softaware-tools deployed to $TARGET_DIR"
