-- TASK-201 Day1 data migration (DML)
-- DDL source: backend/prisma/day1-ddl-skeleton.sql
-- Apply DDL before DML. Paths align with META_KEYS_DAY1 (verified in migrate-day1.ts).

-- §A1
UPDATE Proposal SET status = 'creating' WHERE status = 'draft' AND (json_extract(metadata, '$._discussionSubmitted') IS NULL OR json_extract(metadata, '$._discussionSubmitted') = 0 OR json_extract(metadata, '$._discussionSubmitted') = false);

-- §A2
UPDATE Proposal SET status = 'created' WHERE status IN ('submitted', 'evaluated') AND json_extract(metadata, '$._discussionSubmitted') = 1;

-- §A3
UPDATE Proposal SET status = 'creating' WHERE status = 'rejected';

-- §B1
UPDATE Project SET status = 'planning', submittedToPlanningAt = COALESCE(submittedToPlanningAt, createdAt) WHERE status = 'draft' AND (json_extract(metadata, '$._sourceFrom') = 'proposal' OR json_extract(metadata, '$._proposalId') IS NOT NULL OR EXISTS (SELECT 1 FROM Proposal p WHERE p.projectId = Project.id));

-- §B2
UPDATE Project SET status = 'imported' WHERE status = 'draft' AND NOT (json_extract(metadata, '$._sourceFrom') = 'proposal' OR json_extract(metadata, '$._proposalId') IS NOT NULL OR EXISTS (SELECT 1 FROM Proposal p WHERE p.projectId = Project.id));

-- §B3
UPDATE Project SET status = 'reviewed' WHERE status = 'completed';

-- §B_TS1
UPDATE Project SET writingStartedAt = COALESCE(writingStartedAt, updatedAt) WHERE status IN ('writing', 'written', 'reviewing', 'reviewed') AND writingStartedAt IS NULL;

-- §B_TS2
UPDATE Project SET archivedAt = COALESCE(archivedAt, updatedAt) WHERE status IN ('archived', 'reviewed') AND archivedAt IS NULL;

-- §C
UPDATE Project SET writingStyle = json_extract(metadata, '$.writingStyle') WHERE writingStyle IS NULL AND json_extract(metadata, '$.writingStyle') IS NOT NULL;

-- §D
UPDATE Project SET proposalId = (SELECT p.id FROM Proposal p WHERE p.projectId = Project.id OR p.id = json_extract(Project.metadata, '$._proposalId') LIMIT 1) WHERE proposalId IS NULL AND EXISTS (SELECT 1 FROM Proposal p WHERE p.projectId = Project.id OR p.id = json_extract(Project.metadata, '$._proposalId')) AND (json_extract(metadata, '$._sourceFrom') = 'proposal' OR json_extract(metadata, '$._proposalId') IS NOT NULL);

-- §E
UPDATE Project SET metadata = json_set(COALESCE(metadata, '{}'), '$._fromEvaluate', json('true')) WHERE proposalId IS NOT NULL AND json_extract(metadata, '$._sourceFrom') = 'proposal';

-- §F
SELECT id, title, status, proposalId, metadata FROM Project WHERE status = 'planning' AND proposalId IS NULL AND json_extract(metadata, '$._sourceFrom') = 'proposal';

-- §G
SELECT id FROM Proposal WHERE status = 'approved' AND projectId IS NULL;

-- §ORPHAN
SELECT id, title, json_extract(metadata, '$._proposalId') AS legacyPid FROM Project WHERE proposalId IS NULL AND json_extract(metadata, '$._proposalId') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Proposal p WHERE p.id = json_extract(Project.metadata, '$._proposalId'));
