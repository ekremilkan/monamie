ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';

ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" TEXT,
  ADD COLUMN "paymentIntentId" TEXT,
  ADD COLUMN "deliveryStreet" TEXT,
  ADD COLUMN "deliveryCity" TEXT,
  ADD COLUMN "deliveryZipCode" TEXT,
  ADD COLUMN "deliveryDetails" TEXT;

CREATE UNIQUE INDEX "Order_paymentIntentId_key" ON "Order"("paymentIntentId");