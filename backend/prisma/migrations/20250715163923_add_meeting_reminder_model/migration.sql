-- CreateTable
CREATE TABLE "meeting_reminders" (
    "id" TEXT NOT NULL,
    "reminderKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_reminders_reminderKey_key" ON "meeting_reminders"("reminderKey");

-- CreateIndex
CREATE INDEX "meeting_reminders_reminderKey_idx" ON "meeting_reminders"("reminderKey");

-- CreateIndex
CREATE INDEX "meeting_reminders_sentAt_idx" ON "meeting_reminders"("sentAt");
