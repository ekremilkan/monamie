/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderStatusHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationPreference" DROP CONSTRAINT "NotificationPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderStatusHistory" DROP CONSTRAINT "OrderStatusHistory_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PushSubscription" DROP CONSTRAINT "PushSubscription_userId_fkey";

-- DropIndex
DROP INDEX "public"."Order_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Order_orderNumber_idx";

-- DropIndex
DROP INDEX "public"."Order_status_idx";

-- DropIndex
DROP INDEX "public"."Order_userId_idx";

-- DropIndex
DROP INDEX "public"."PushSubscription_endpoint_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "updatedAt",
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."NotificationPreference";

-- DropTable
DROP TABLE "public"."OrderStatusHistory";

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
