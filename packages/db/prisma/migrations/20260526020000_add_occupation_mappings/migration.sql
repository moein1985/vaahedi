-- CreateTable: occupation_mappings
CREATE TABLE "occupation_mappings" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "occupationCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupation_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occupation_mappings_profileId_occupationCategoryId_key"
    ON "occupation_mappings"("profileId", "occupationCategoryId");
CREATE INDEX "occupation_mappings_profileId_idx" ON "occupation_mappings"("profileId");
CREATE INDEX "occupation_mappings_occupationCategoryId_idx" ON "occupation_mappings"("occupationCategoryId");

-- AddForeignKey
ALTER TABLE "occupation_mappings"
    ADD CONSTRAINT "occupation_mappings_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "user_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "occupation_mappings"
    ADD CONSTRAINT "occupation_mappings_occupationCategoryId_fkey"
    FOREIGN KEY ("occupationCategoryId") REFERENCES "occupation_categories"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from legacy single occupation field
INSERT INTO "occupation_mappings" ("id", "profileId", "occupationCategoryId", "createdAt")
SELECT
    'legacy_' || "id" AS "id",
    "id" AS "profileId",
    "occupationCategoryId",
    CURRENT_TIMESTAMP
FROM "user_profiles"
WHERE "occupationCategoryId" IS NOT NULL
ON CONFLICT ("profileId", "occupationCategoryId") DO NOTHING;
