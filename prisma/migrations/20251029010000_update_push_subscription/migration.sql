-- AlterTable
ALTER TABLE "PushSubscription"
    ADD COLUMN     "keys" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN     "expirationTime" TIMESTAMP(3),
    ADD COLUMN     "userAgent" TEXT,
    ADD COLUMN     "platform" TEXT,
    ADD COLUMN     "locale" TEXT DEFAULT 'de-DE';

-- Allow subscriptions without a linked user
ALTER TABLE "PushSubscription"
    ALTER COLUMN "userId" DROP NOT NULL;

-- Move existing key material into the new JSON column
UPDATE "PushSubscription"
SET "keys" = jsonb_build_object('p256dh', "p256dh", 'auth', "auth");

-- Ensure existing rows have a locale
UPDATE "PushSubscription"
SET "locale" = 'de-DE'
WHERE "locale" IS NULL;

-- Clean up legacy columns
ALTER TABLE "PushSubscription"
    DROP COLUMN "p256dh",
    DROP COLUMN "auth";

-- Prisma schema does not define a default for `keys`
ALTER TABLE "PushSubscription"
    ALTER COLUMN "keys" DROP DEFAULT;
