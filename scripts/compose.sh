#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy \
      FTP_PROXY ftp_proxy ALL_PROXY all_proxy

export NO_PROXY='*'

echo "Proxy in shell: disabled"
if docker info 2>/dev/null | grep -qi 'proxy'; then
    echo "WARNING: Docker daemon still has proxy settings (see below)."
    docker info 2>/dev/null | grep -i proxy || true
    echo "Run: ./scripts/docker-clear-proxy.sh"
fi

exec docker compose "$@"
