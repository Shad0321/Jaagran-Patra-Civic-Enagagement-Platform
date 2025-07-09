-- CreateEnum
CREATE TYPE "SubordinateType" AS ENUM ('DIRECT', 'INDIRECT', 'TEMPORARY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'ASSISTANT_PRO';
ALTER TYPE "UserRole" ADD VALUE 'PRO';
ALTER TYPE "UserRole" ADD VALUE 'MALIK';
ALTER TYPE "UserRole" ADD VALUE 'SHAKTI_KENDRA_HEAD';
ALTER TYPE "UserRole" ADD VALUE 'PANNA_PRAMUKH';

-- AlterTable
ALTER TABLE "constituencies" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "districts" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "local_bodies" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "mla_profiles" ADD COLUMN     "maxSubordinates" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "shakti_kendras" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "states" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "localBodyId" TEXT,
ADD COLUMN     "phoneVerificationToken" TEXT,
ADD COLUMN     "pollingBoothId" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "shaktiKendraId" TEXT,
ADD COLUMN     "supervisorId" TEXT;

-- CreateTable
CREATE TABLE "subordinate_relations" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "subordinateId" TEXT NOT NULL,
    "type" "SubordinateType" NOT NULL DEFAULT 'DIRECT',
    "designation" TEXT,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stateId" TEXT,
    "districtId" TEXT,
    "constituencyId" TEXT,
    "shaktiKendraId" TEXT,
    "localBodyId" TEXT,
    "pollingBoothId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subordinate_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subordinate_relations_supervisorId_idx" ON "subordinate_relations"("supervisorId");

-- CreateIndex
CREATE INDEX "subordinate_relations_subordinateId_idx" ON "subordinate_relations"("subordinateId");

-- CreateIndex
CREATE INDEX "subordinate_relations_type_idx" ON "subordinate_relations"("type");

-- CreateIndex
CREATE INDEX "subordinate_relations_isActive_idx" ON "subordinate_relations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subordinate_relations_supervisorId_subordinateId_key" ON "subordinate_relations"("supervisorId", "subordinateId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "device_tokens_token_idx" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_supervisorId_idx" ON "users"("supervisorId");

-- CreateIndex
CREATE INDEX "users_currentLatitude_currentLongitude_idx" ON "users"("currentLatitude", "currentLongitude");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shaktiKendraId_fkey" FOREIGN KEY ("shaktiKendraId") REFERENCES "shakti_kendras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_localBodyId_fkey" FOREIGN KEY ("localBodyId") REFERENCES "local_bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_pollingBoothId_fkey" FOREIGN KEY ("pollingBoothId") REFERENCES "polling_booths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_subordinateId_fkey" FOREIGN KEY ("subordinateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_shaktiKendraId_fkey" FOREIGN KEY ("shaktiKendraId") REFERENCES "shakti_kendras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_localBodyId_fkey" FOREIGN KEY ("localBodyId") REFERENCES "local_bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subordinate_relations" ADD CONSTRAINT "subordinate_relations_pollingBoothId_fkey" FOREIGN KEY ("pollingBoothId") REFERENCES "polling_booths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
