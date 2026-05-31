-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "profile" JSONB,
    "gender" TEXT,
    "age" TEXT,
    "identity" TEXT,
    "appearance" TEXT,
    "personality" TEXT,
    "interests" TEXT,
    "roleType" TEXT,
    "experience" TEXT,
    "keyRelations" TEXT,
    "catchphrase" TEXT,
    "projectId" TEXT,
    "proposalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Character_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("age", "appearance", "catchphrase", "createdAt", "description", "experience", "gender", "id", "identity", "interests", "keyRelations", "name", "personality", "profile", "projectId", "role", "roleType", "updatedAt") SELECT "age", "appearance", "catchphrase", "createdAt", "description", "experience", "gender", "id", "identity", "interests", "keyRelations", "name", "personality", "profile", "projectId", "role", "roleType", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE TABLE "new_CreativeFlow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "projectId" TEXT,
    "proposalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreativeFlow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreativeFlow_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CreativeFlow" ("content", "createdAt", "id", "projectId", "tags", "title", "updatedAt") SELECT "content", "createdAt", "id", "projectId", "tags", "title", "updatedAt" FROM "CreativeFlow";
DROP TABLE "CreativeFlow";
ALTER TABLE "new_CreativeFlow" RENAME TO "CreativeFlow";
CREATE TABLE "new_TimelineEntry" (
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
    "projectId" TEXT,
    "proposalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimelineEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEntry_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TimelineEntry" ("characters", "createdAt", "emotionStage", "id", "location", "narrativeMode", "notes", "outcome", "premise", "process", "projectId", "sortOrder", "time", "updatedAt") SELECT "characters", "createdAt", "emotionStage", "id", "location", "narrativeMode", "notes", "outcome", "premise", "process", "projectId", "sortOrder", "time", "updatedAt" FROM "TimelineEntry";
DROP TABLE "TimelineEntry";
ALTER TABLE "new_TimelineEntry" RENAME TO "TimelineEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
