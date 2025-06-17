-- AlterTable
ALTER TABLE "users" ADD COLUMN "suspendedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "suspendedBy" TEXT;
ALTER TABLE "users" ADD COLUMN "suspensionReason" TEXT;
