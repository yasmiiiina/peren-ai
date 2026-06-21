#!/usr/bin/env bash
# Pull latest code and redeploy containers
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.production.example to .env first."
  exit 1
fi

git pull --ff-only
docker compose pull db 2>/dev/null || true
docker compose build --no-cache frontend backend
docker compose up -d
docker compose ps
docker compose logs --tail=30 backend
