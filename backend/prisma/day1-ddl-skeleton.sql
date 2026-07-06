-- Day 1 DDL skeleton (TASK-200) — DO NOT run via prisma migrate dev in TASK-200
-- DML / apply: TASK-201 migrate-day1.ts on a DB copy or user-authorized environment
-- DDL source for cross-check: backend/prisma/day1-ddl-skeleton.sql

-- Project: 7 timestamps + writingStyle + proposalId (FK column; unique index)
ALTER TABLE "Project" ADD COLUMN "submittedToPlanningAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "greenlitAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "writingStartedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "workCompletedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "submittedToReviewAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "writingStyle" TEXT;
ALTER TABLE "Project" ADD COLUMN "proposalId" TEXT;
CREATE UNIQUE INDEX "Project_proposalId_key" ON "Project"("proposalId");

-- Proposal: deletedAt
ALTER TABLE "Proposal" ADD COLUMN "deletedAt" DATETIME;
