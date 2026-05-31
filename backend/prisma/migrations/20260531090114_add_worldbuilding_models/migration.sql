-- AlterTable
ALTER TABLE "Character" ADD COLUMN "age" TEXT;
ALTER TABLE "Character" ADD COLUMN "appearance" TEXT;
ALTER TABLE "Character" ADD COLUMN "catchphrase" TEXT;
ALTER TABLE "Character" ADD COLUMN "experience" TEXT;
ALTER TABLE "Character" ADD COLUMN "gender" TEXT;
ALTER TABLE "Character" ADD COLUMN "identity" TEXT;
ALTER TABLE "Character" ADD COLUMN "interests" TEXT;
ALTER TABLE "Character" ADD COLUMN "keyRelations" TEXT;
ALTER TABLE "Character" ADD COLUMN "personality" TEXT;
ALTER TABLE "Character" ADD COLUMN "roleType" TEXT;

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "characters" TEXT NOT NULL,
    "premise" TEXT,
    "process" TEXT,
    "outcome" TEXT,
    "narrativeMode" TEXT,
    "emotionStage" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimelineEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreativeFlow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreativeFlow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
