/*
  Warnings:

  - A unique constraint covering the columns `[userId,orderId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Review_userId_orderId_productId_key";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "comment" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_orderId_key" ON "Review"("userId", "orderId");
