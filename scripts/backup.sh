#!/usr/bin/env sh
# Dumps the database to ./backups/vision-goals-YYYYmmdd-HHMM.sql.gz
# Usage (on the server, next to docker-compose.yml): ./scripts/backup.sh
set -eu
mkdir -p backups
FILE="backups/vision-goals-$(date +%Y%m%d-%H%M).sql.gz"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$FILE"
echo "Saved $FILE"
