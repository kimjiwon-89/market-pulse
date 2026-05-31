#!/bin/sh
set -eu

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_USERNAME:?DB_USERNAME is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

MIGRATIONS_DIR="${MIGRATIONS_DIR:-/migrations}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migration directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

psql_cmd() {
  psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 \
    "$@"
}

psql_cmd <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   TEXT PRIMARY KEY,
    checksum   TEXT NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);
SQL

set -- "$MIGRATIONS_DIR"/*.sql
if [ ! -e "$1" ]; then
  echo "No migration files found in $MIGRATIONS_DIR" >&2
  exit 1
fi

for file in "$@"; do
  filename="$(basename "$file")"
  filename_sql="$(printf "%s" "$filename" | sed "s/'/''/g")"
  checksum="$(sha256sum "$file" | awk '{print $1}')"
  checksum_sql="$(printf "%s" "$checksum" | sed "s/'/''/g")"

  applied="$(psql_cmd -At -c "SELECT 1 FROM schema_migrations WHERE filename = '$filename_sql' LIMIT 1;")"
  if [ "$applied" = "1" ]; then
    echo "Skipping already applied migration: $filename"
    continue
  fi

  echo "Applying migration: $filename"
  psql_cmd <<SQL
BEGIN;
\\i $file
INSERT INTO schema_migrations (filename, checksum)
VALUES ('$filename_sql', '$checksum_sql');
COMMIT;
SQL
done

echo "Migrations complete."
