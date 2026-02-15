#!/usr/bin/env bash
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"
exec java -jar "$BASE_DIR/lib/market-pulse-api.jar" \
  --spring.config.additional-location=file:"$BASE_DIR/conf/"
