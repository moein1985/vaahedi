#!/bin/bash
set -e

echo "=== Running deliveryTerms migration ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c \"ALTER TABLE products ALTER COLUMN \\\"deliveryTerms\\\" TYPE TEXT USING \\\"deliveryTerms\\\"::TEXT;\""

echo ""
echo "=== Verifying column type ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' AND column_name='deliveryTerms';\""

echo ""
echo "=== Recording migration in _prisma_migrations ==="
sg docker -c "docker exec vaahedi-prod-postgres-1 psql -U vaahedi -d vaahedi -c \"INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (gen_random_uuid(), 'manual', NOW(), '20260516000000_delivery_terms_string', NULL, NULL, NOW(), 1) ON CONFLICT DO NOTHING;\""

echo "=== Done ==="
