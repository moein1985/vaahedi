-- PostgreSQL initialization script
-- این فایل فقط یک بار هنگام ساخت اولیه container اجرا می‌شود

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- برای UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- برای جستجوی فارسی fuzzy

-- ── Full-Text Search Config for Persian ──────────────────────────────────────
-- در صورت نیاز به فارسی‌کاوی می‌توان این را extend کرد

-- ── Default Timezone ─────────────────────────────────────────────────────────
SET timezone = 'Asia/Tehran';
