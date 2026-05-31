#!/bin/bash
set -euo pipefail

cd /app

echo "=== [1/5] Pull images ==="
docker compose pull api web

echo "=== [2/5] Apply database migrations ==="
docker compose run --rm -T migrator

echo "=== [3/5] Restart containers ==="
docker compose up -d --no-build

echo "=== [4/5] Health check ==="
docker compose exec -T api wget -qO- http://localhost:8080/actuator/health

echo "=== [5/5] Deployment status ==="
docker compose ps

docker image prune -f
