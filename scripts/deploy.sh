#!/bin/bash
set -e

cd /app

echo "=== [1/3] 새 이미지 pull ==="
docker compose pull api web

echo "=== [2/3] 컨테이너 재시작 ==="
docker compose up -d --no-build

echo "=== [3/3] 완료 ==="
docker compose ps

# 오래된 이미지 정리 (최근 3개 제외)
docker image prune -f
