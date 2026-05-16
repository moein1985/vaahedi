#!/bin/bash

echo "=== Tables in vaahedi DB ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c '\dt'"

echo ""
echo "=== Product columns (lowercase) ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='product' ORDER BY ordinal_position LIMIT 30;\""

echo ""
echo "=== Done ==="
