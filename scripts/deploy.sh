#!/bin/bash
set -euo pipefail

cd /app

echo "=== [1/3] Pull images ==="
docker compose pull api web

echo "=== [2/3] Restart containers ==="
docker compose up -d --no-build

echo "=== [3/3] Deployment status ==="
docker compose ps

docker image prune -f
