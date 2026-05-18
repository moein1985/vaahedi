-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: agri_stakeholder_phase1
-- سامانه ذینفعان حوزه کشاورزی — Phase 1
-- ─────────────────────────────────────────────────────────────────────────────

-- AlterEnum: Add agriculture-specific document types
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'AGRICULTURAL_LICENSE';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'FARMING_CERTIFICATE';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'WATER_RIGHTS_DOCUMENT';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'EXPORT_CERTIFICATE';

-- CreateTable: OccupationCategory (hierarchical taxonomy of agriculture occupations)
CREATE TABLE "occupation_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "parentId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occupation_categories_code_key" ON "occupation_categories"("code");
CREATE INDEX "occupation_categories_parentId_idx" ON "occupation_categories"("parentId");
CREATE INDEX "occupation_categories_code_idx" ON "occupation_categories"("code");

-- AddForeignKey: self-referencing for parent/children
ALTER TABLE "occupation_categories" ADD CONSTRAINT "occupation_categories_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "occupation_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Extend user_profiles with agriculture fields
ALTER TABLE "user_profiles"
    ADD COLUMN "occupationCategoryId" TEXT,
    ADD COLUMN "farmingAreaHectares" DECIMAL(65,30),
    ADD COLUMN "irrigationType" TEXT,
    ADD COLUMN "mainCrops" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "tradeDirection" TEXT;

-- CreateIndex: on user_profiles.occupationCategoryId
CREATE INDEX "user_profiles_occupationCategoryId_idx" ON "user_profiles"("occupationCategoryId");

-- AddForeignKey: user_profiles → occupation_categories
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_occupationCategoryId_fkey"
    FOREIGN KEY ("occupationCategoryId") REFERENCES "occupation_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: HarvestCalendar (display-only in MVP, admin-managed)
CREATE TABLE "harvest_calendar" (
    "id" TEXT NOT NULL,
    "cropNameFa" TEXT NOT NULL,
    "cropNameEn" TEXT,
    "commodityGroup" "CommodityGroup" NOT NULL DEFAULT 'AGRICULTURAL',
    "harvestStartMonth" INTEGER NOT NULL,
    "harvestEndMonth" INTEGER NOT NULL,
    "province" TEXT,
    "variety" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvest_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "harvest_calendar_commodityGroup_idx" ON "harvest_calendar"("commodityGroup");
CREATE INDEX "harvest_calendar_harvestStartMonth_harvestEndMonth_idx" ON "harvest_calendar"("harvestStartMonth", "harvestEndMonth");

-- CreateTable: MarketInsight (display-only in MVP, admin-managed)
CREATE TABLE "market_insights" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "commodityFa" TEXT NOT NULL,
    "commodityEn" TEXT,
    "insightType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dataDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "imageKey" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_insights_insightType_idx" ON "market_insights"("insightType");
CREATE INDEX "market_insights_isPublished_publishedAt_idx" ON "market_insights"("isPublished", "publishedAt");
