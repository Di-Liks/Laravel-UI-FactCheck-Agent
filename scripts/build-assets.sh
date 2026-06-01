#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building frontend assets (Vite)..."
docker compose run --rm node sh -c "npm install && npm run build"
echo "Done: public/build/manifest.json"
