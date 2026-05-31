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
for attempt in $(seq 1 30); do
  if docker compose exec -T api wget -qO- http://localhost:8080/actuator/health; then
    echo
    echo "API health check passed."
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "API health check failed after 30 attempts."
    docker compose logs --tail=120 api
    exit 1
  fi

  echo "API is not ready yet. Retry ${attempt}/30..."
  sleep 5
done

echo "=== [5/5] Deployment status ==="
docker compose ps

docker image prune -f
