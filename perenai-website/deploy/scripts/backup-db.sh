#!/usr/bin/env bash
# Daily PostgreSQL backup — add to crontab:
# 0 3 * * * /opt/perenai/deploy/scripts/backup-db.sh >> /var/log/perenai-backup.log 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/perenai}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"
cd "${PROJECT_DIR}"

source .env 2>/dev/null || true
POSTGRES_USER="${POSTGRES_USER:-perenai}"
POSTGRES_DB="${POSTGRES_DB:-perenai}"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/perenai_${STAMP}.sql.gz"

docker compose exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${FILE}"
find "${BACKUP_DIR}" -name 'perenai_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date -Iseconds)] Backup OK: ${FILE}"
