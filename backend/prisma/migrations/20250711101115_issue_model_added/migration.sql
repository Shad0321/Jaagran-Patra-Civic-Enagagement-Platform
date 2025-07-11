/*
  Warnings:

  - The values [ASSISTANT_PRO,PRO,MALIK,SHAKTI_KENDRA_HEAD,PANNA_PRAMUKH] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `localBodyId` on the `issues` table. All the data in the column will be lost.
  - You are about to drop the column `pollingBoothId` on the `issues` table. All the data in the column will be lost.
  - You are about to drop the column `shaktiKendraId` on the `issues` table. All the data in the column will be lost.
  - You are about to drop the column `maxSubordinates` on the `mla_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `localBodyId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `pollingBoothId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `shaktiKendraId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `local_bodies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `polling_booths` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shakti_kendras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subordinate_relations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('MEMBER_UPDATE', 'CITIZEN_COMMENT', 'STATUS_CHANGE', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SHAKTI_KENDRA', 'PANNA_PRAMUKH', 'LOCAL_BODY', 'POLLING_BOOTH', 'WARD', 'BLOCK', 'MANDAL', 'TEHSIL', 'GRAM_PANCHAYAT', 'MUNICIPALITY', 'CORPORATION', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'CITIZEN', 'MEMBER', 'MLA');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "notifications" ALTER COLUMN "targetRole" TYPE "UserRole_new" USING ("targetRole"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "issues" DROP CONSTRAINT "issues_localBodyId_fkey";

-- DropForeignKey
ALTER TABLE "issues" DROP CONSTRAINT "issues_pollingBoothId_fkey";

-- DropForeignKey
ALTER TABLE "issues" DROP CONSTRAINT "issues_shaktiKendraId_fkey";

-- DropForeignKey
ALTER TABLE "local_bodies" DROP CONSTRAINT "local_bodies_shaktiKendraId_fkey";

-- DropForeignKey
ALTER TABLE "polling_booths" DROP CONSTRAINT "polling_booths_localBodyId_fkey";

-- DropForeignKey
ALTER TABLE "shakti_kendras" DROP CONSTRAINT "shakti_kendras_constituencyId_fkey";

-- DropForeignKey
ALTER TABLE "shakti_kendras" DROP CONSTRAINT "shakti_kendras_districtId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_constituencyId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_districtId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_localBodyId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_pollingBoothId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_shaktiKendraId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_stateId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_subordinateId_fkey";

-- DropForeignKey
ALTER TABLE "subordinate_relations" DROP CONSTRAINT "subordinate_relations_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_localBodyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_pollingBoothId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_shaktiKendraId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_supervisorId_fkey";

-- DropIndex
DROP INDEX "users_supervisorId_idx";

-- AlterTable
ALTER TABLE "issue_updates" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "hoursWorked" DOUBLE PRECISION,
ADD COLUMN     "imageUrls" JSONB,
ADD COLUMN     "mediaType" "MediaType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "nextSteps" TEXT,
ADD COLUMN     "progressPercentage" INTEGER,
ADD COLUMN     "updateType" "UpdateType" NOT NULL DEFAULT 'CITIZEN_COMMENT',
ALTER COLUMN "message" DROP NOT NULL;

-- AlterTable
ALTER TABLE "issues" DROP COLUMN "localBodyId",
DROP COLUMN "pollingBoothId",
DROP COLUMN "shaktiKendraId",
ADD COLUMN     "bodyId" TEXT,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voiceNote" TEXT;

-- AlterTable
ALTER TABLE "mla_profiles" DROP COLUMN "maxSubordinates";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "localBodyId",
DROP COLUMN "pollingBoothId",
DROP COLUMN "shaktiKendraId",
DROP COLUMN "supervisorId",
ADD COLUMN     "bodyId" TEXT,
ADD COLUMN     "mlaId" TEXT;

-- DropTable
DROP TABLE "local_bodies";

-- DropTable
DROP TABLE "polling_booths";

-- DropTable
DROP TABLE "shakti_kendras";

-- DropTable
DROP TABLE "subordinate_relations";

-- DropEnum
DROP TYPE "SubordinateType";

-- CreateTable
CREATE TABLE "member_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bodyType" "BodyType",
    "designation" TEXT,
    "description" TEXT,
    "canReceiveIssues" BOOLEAN NOT NULL DEFAULT true,
    "canUpdateIssues" BOOLEAN NOT NULL DEFAULT true,
    "canCreateSessions" BOOLEAN NOT NULL DEFAULT false,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "resolvedIssues" INTEGER NOT NULL DEFAULT 0,
    "pendingIssues" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bodies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "BodyType" NOT NULL,
    "description" TEXT,
    "stateId" TEXT,
    "districtId" TEXT,
    "constituencyId" TEXT,
    "parentBodyId" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "headName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bodies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_userId_key" ON "member_profiles"("userId");

-- CreateIndex
CREATE INDEX "member_profiles_bodyType_idx" ON "member_profiles"("bodyType");

-- CreateIndex
CREATE INDEX "member_profiles_totalIssues_idx" ON "member_profiles"("totalIssues");

-- CreateIndex
CREATE INDEX "member_profiles_resolvedIssues_idx" ON "member_profiles"("resolvedIssues");

-- CreateIndex
CREATE INDEX "bodies_type_idx" ON "bodies"("type");

-- CreateIndex
CREATE INDEX "bodies_stateId_idx" ON "bodies"("stateId");

-- CreateIndex
CREATE INDEX "bodies_districtId_idx" ON "bodies"("districtId");

-- CreateIndex
CREATE INDEX "bodies_constituencyId_idx" ON "bodies"("constituencyId");

-- CreateIndex
CREATE INDEX "bodies_parentBodyId_idx" ON "bodies"("parentBodyId");

-- CreateIndex
CREATE INDEX "bodies_isActive_idx" ON "bodies"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "bodies_stateId_districtId_constituencyId_code_type_key" ON "bodies"("stateId", "districtId", "constituencyId", "code", "type");

-- CreateIndex
CREATE INDEX "issue_updates_updateType_idx" ON "issue_updates"("updateType");

-- CreateIndex
CREATE INDEX "issues_bodyId_idx" ON "issues"("bodyId");

-- CreateIndex
CREATE INDEX "users_bodyId_idx" ON "users"("bodyId");

-- CreateIndex
CREATE INDEX "users_mlaId_idx" ON "users"("mlaId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_mlaId_fkey" FOREIGN KEY ("mlaId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodies" ADD CONSTRAINT "bodies_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodies" ADD CONSTRAINT "bodies_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodies" ADD CONSTRAINT "bodies_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodies" ADD CONSTRAINT "bodies_parentBodyId_fkey" FOREIGN KEY ("parentBodyId") REFERENCES "bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
