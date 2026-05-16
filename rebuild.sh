#!/bin/bash
set -e

echo "=== Building web and api images ==="
cd /home/moein/vaahedi

sg docker -c "docker compose -f docker-compose.prod.yml build web api --no-cache 2>&1"

echo ""
echo "=== Restarting web, api, worker services ==="
sg docker -c "docker compose -f docker-compose.prod.yml up -d web api worker 2>&1"

echo ""
echo "=== Container status ==="
sg docker -c "docker compose -f docker-compose.prod.yml ps 2>&1"

echo "=== Done ==="
