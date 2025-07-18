-- CreateEnum
CREATE TYPE "ChatGroupType" AS ENUM ('PUBLIC_MLA_GROUP', 'PRIVATE_MLA_GROUP');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'REMOVED', 'LEFT');

-- CreateTable
CREATE TABLE "chat_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChatGroupType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "stateId" TEXT,
    "districtId" TEXT,
    "constituencyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_group_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_reads" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "addedById" TEXT,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "canRemove" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "chat_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_groups_ownerId_idx" ON "chat_groups"("ownerId");

-- CreateIndex
CREATE INDEX "chat_groups_type_idx" ON "chat_groups"("type");

-- CreateIndex
CREATE INDEX "chat_groups_stateId_idx" ON "chat_groups"("stateId");

-- CreateIndex
CREATE INDEX "chat_groups_constituencyId_idx" ON "chat_groups"("constituencyId");

-- CreateIndex
CREATE INDEX "chat_groups_isActive_idx" ON "chat_groups"("isActive");

-- CreateIndex
CREATE INDEX "chat_group_messages_groupId_idx" ON "chat_group_messages"("groupId");

-- CreateIndex
CREATE INDEX "chat_group_messages_senderId_idx" ON "chat_group_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_group_messages_createdAt_idx" ON "chat_group_messages"("createdAt");

-- CreateIndex
CREATE INDEX "chat_message_reads_messageId_idx" ON "chat_message_reads"("messageId");

-- CreateIndex
CREATE INDEX "chat_message_reads_userId_idx" ON "chat_message_reads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_message_reads_messageId_userId_key" ON "chat_message_reads"("messageId", "userId");

-- CreateIndex
CREATE INDEX "chat_group_members_groupId_idx" ON "chat_group_members"("groupId");

-- CreateIndex
CREATE INDEX "chat_group_members_userId_idx" ON "chat_group_members"("userId");

-- CreateIndex
CREATE INDEX "chat_group_members_status_idx" ON "chat_group_members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "chat_group_members_groupId_userId_key" ON "chat_group_members"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_messages" ADD CONSTRAINT "chat_group_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_messages" ADD CONSTRAINT "chat_group_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_reads" ADD CONSTRAINT "chat_message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_group_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_reads" ADD CONSTRAINT "chat_message_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
