-- AlterTable
ALTER TABLE "user_profiles"
ADD COLUMN "passportNumber" TEXT,
ADD COLUMN "passportExpiryDate" TIMESTAMP(3);
