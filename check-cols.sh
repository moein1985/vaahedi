#!/bin/bash
set -e

echo "=== Product table columns ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Product' ORDER BY ordinal_position;\""

echo ""
echo "=== Done ==="
