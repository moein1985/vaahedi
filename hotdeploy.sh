#!/bin/bash
set -e

echo "=== Copying new dist files into running api container ==="
sg docker -c "docker cp /home/moein/vaahedi/apps/server/dist/. vaahedi-prod-api-1:/app/apps/server/dist/"
sg docker -c "docker cp /home/moein/vaahedi/packages/shared/dist/. vaahedi-prod-api-1:/app/packages/shared/dist/"
sg docker -c "docker cp /home/moein/vaahedi/packages/db/dist/. vaahedi-prod-api-1:/app/packages/db/dist/"
sg docker -c "docker cp /home/moein/vaahedi/packages/db/prisma-client/. vaahedi-prod-api-1:/app/node_modules/.prisma/client/"

echo ""
echo "=== Copying new web dist into running web container ==="
sg docker -c "docker cp /home/moein/vaahedi/apps/web/dist/. vaahedi-prod-web-1:/usr/share/nginx/html/"

echo ""
echo "=== Restarting api, worker, web containers ==="
sg docker -c "docker restart vaahedi-prod-api-1 vaahedi-prod-worker-1 vaahedi-prod-web-1"

echo ""
echo "=== Waiting for containers to start ==="
sleep 10

echo ""
echo "=== Container status ==="
sg docker -c "docker ps --format 'table {{.Names}}\t{{.Status}}'"

echo ""
echo "=== API health check ==="
curl -s http://localhost/health || echo "health check returned error"

echo "=== Done ==="
