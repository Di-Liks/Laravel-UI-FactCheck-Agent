#!/usr/bin/env bash
set -euo pipefail

echo "=== Proxy in current shell ==="
env | grep -i proxy || echo "(none)"

echo ""
echo "=== Proxy in Docker daemon ==="
if docker info 2>/dev/null | grep -i proxy; then
    HAS_DAEMON_PROXY=1
else
    echo "(none in docker info)"
    HAS_DAEMON_PROXY=0
fi

PROXY_DROPIN="/etc/systemd/system/docker.service.d/http-proxy.conf"
DAEMON_JSON="/etc/docker/daemon.json"

echo ""
echo "=== System files ==="
if [ -f "$PROXY_DROPIN" ]; then
    echo "Found: $PROXY_DROPIN"
    sudo cat "$PROXY_DROPIN"
else
    echo "Not found: $PROXY_DROPIN"
fi

if [ -f "$DAEMON_JSON" ]; then
    echo "Found: $DAEMON_JSON"
    sudo cat "$DAEMON_JSON"
else
    echo "Not found: $DAEMON_JSON"
fi

if [ "${1:-}" = "--apply" ]; then
    echo ""
    echo "Removing daemon proxy config..."
    if [ -f "$PROXY_DROPIN" ]; then
        sudo rm -f "$PROXY_DROPIN"
        echo "Removed $PROXY_DROPIN"
    fi
    if [ -f "$DAEMON_JSON" ] && sudo grep -qE 'proxy|Proxy' "$DAEMON_JSON" 2>/dev/null; then
        echo "Edit $DAEMON_JSON manually and remove proxy keys, then restart docker."
    else
        sudo systemctl daemon-reload
        sudo systemctl restart docker
        echo "Docker restarted."
    fi
    echo ""
    docker info 2>/dev/null | grep -i proxy || echo "Daemon proxy: cleared"
else
    echo ""
    echo "To remove systemd proxy drop-in and restart Docker:"
    echo "  $0 --apply"
fi
