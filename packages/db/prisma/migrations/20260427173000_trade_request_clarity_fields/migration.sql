-- AlterTable
ALTER TABLE "trade_requests"
ADD COLUMN "serviceCode" TEXT,
ADD COLUMN "supplySourceType" TEXT,
ADD COLUMN "supplySourceName" TEXT;

-- CreateIndex
CREATE INDEX "trade_requests_serviceCode_idx" ON "trade_requests"("serviceCode");

-- CreateIndex
CREATE INDEX "trade_requests_supplySourceType_idx" ON "trade_requests"("supplySourceType");
