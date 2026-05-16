#!/bin/bash
set -e

echo "=== Checking current migrations ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c 'SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;'"

echo ""
echo "=== Checking deliveryTerms column type ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Product' AND column_name='deliveryTerms';\""

echo ""
echo "=== Done ==="
