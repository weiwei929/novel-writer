-- Project.proposalId: ProposalPrimaryProject link (schema drift — never migrated)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedToPlanningAt" DATETIME,
    "greenlitAt" DATETIME,
    "writingStartedAt" DATETIME,
    "workCompletedAt" DATETIME,
    "submittedToReviewAt" DATETIME,
    "archivedAt" DATETIME,
    "deletedAt" DATETIME,
    "writingStyle" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "masterPrompt" TEXT,
    "tags" JSONB,
    "collectionId" TEXT,
    "proposalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("archivedAt", "author", "collectionId", "coverImage", "createdAt", "deletedAt", "description", "greenlitAt", "id", "masterPrompt", "metadata", "status", "submittedToPlanningAt", "submittedToReviewAt", "tags", "title", "updatedAt", "wordCount", "workCompletedAt", "writingStartedAt", "writingStyle") SELECT "archivedAt", "author", "collectionId", "coverImage", "createdAt", "deletedAt", "description", "greenlitAt", "id", "masterPrompt", "metadata", "status", "submittedToPlanningAt", "submittedToReviewAt", "tags", "title", "updatedAt", "wordCount", "workCompletedAt", "writingStartedAt", "writingStyle" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_proposalId_key" ON "Project"("proposalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
