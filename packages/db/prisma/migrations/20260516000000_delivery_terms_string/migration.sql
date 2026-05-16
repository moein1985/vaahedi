-- Migration: change deliveryTerms column from DeliveryTerms enum to TEXT
-- This allows storing multiple comma-separated delivery terms (e.g. "EXW,FOB")

ALTER TABLE "products" ALTER COLUMN "deliveryTerms" TYPE TEXT USING "deliveryTerms"::TEXT;
