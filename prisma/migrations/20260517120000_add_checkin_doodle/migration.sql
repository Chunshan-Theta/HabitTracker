-- AlterTable
ALTER TABLE "CheckinEvent" ADD COLUMN "doodlePayload" BYTEA;

-- CreateIndex
CREATE INDEX "CheckinEvent_cardId_createdAt_idx" ON "CheckinEvent"("cardId", "createdAt");
