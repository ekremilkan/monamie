-- CreateTable
CREATE TABLE "RateLimit" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedAttempt" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimit_key_createdAt_idx" ON "RateLimit"("key", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimit_ip_createdAt_idx" ON "RateLimit"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "FailedAttempt_email_ipAddress_idx" ON "FailedAttempt"("email", "ipAddress");

-- CreateIndex
CREATE INDEX "FailedAttempt_timestamp_idx" ON "FailedAttempt"("timestamp");
