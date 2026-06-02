-- CreateTable
CREATE TABLE "FileReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileContent" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'md',
    "sourceUrl" TEXT,
    "processingType" TEXT NOT NULL DEFAULT 'none',
    "proposalId" TEXT,
    "annotations" JSONB,
    "comment" TEXT,
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
