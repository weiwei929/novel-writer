-- Project workflow timestamps, writing style, and soft delete
ALTER TABLE "Project" ADD COLUMN "submittedToPlanningAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "greenlitAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "writingStartedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "workCompletedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "submittedToReviewAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "writingStyle" TEXT;

-- Proposal soft delete
ALTER TABLE "Proposal" ADD COLUMN "deletedAt" DATETIME;
