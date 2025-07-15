-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "isOpenToAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceData" JSONB,
ADD COLUMN     "zoomMeetingData" JSONB,
ADD COLUMN     "zoomMeetingId" TEXT;

-- CreateIndex
CREATE INDEX "sessions_zoomMeetingId_idx" ON "sessions"("zoomMeetingId");

-- CreateIndex
CREATE INDEX "sessions_isOpenToAll_idx" ON "sessions"("isOpenToAll");

-- CreateIndex
CREATE INDEX "sessions_isRecurring_idx" ON "sessions"("isRecurring");
