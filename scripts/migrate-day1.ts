/**
 * TASK-201 Day1 migration runner — dry-run / apply on explicit --db only.
 * Never targets production data/novel.db without operator confirmation.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(__dirname, '../backend/package.json'))
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3') as typeof import('better-sqlite3')
const { META_KEYS_DAY1 } = require('../backend/dist/constants/metadata-keys') as {
  META_KEYS_DAY1: typeof import('../backend/src/constants/metadata-keys').META_KEYS_DAY1
}

const REPO_ROOT = path.resolve(__dirname, '..')
const SKELETON_PATH = path.join(REPO_ROOT, 'backend/prisma/day1-ddl-skeleton.sql')
const MIGRATION_SQL_PATH = path.join(REPO_ROOT, 'backend/prisma/migration.sql')

const META_PATHS = {
  discussionSubmitted: `$.${META_KEYS_DAY1.DISCUSSION_SUBMITTED}`,
  sourceFrom: `$.${META_KEYS_DAY1.SOURCE_FROM}`,
  proposalIdLegacy: `$.${META_KEYS_DAY1.PROPOSAL_ID_LEGACY}`,
  fromEvaluate: `$.${META_KEYS_DAY1.FROM_EVALUATE}`,
}

type Section = { tag: string; sql: string; kind: 'update' | 'select' }

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run')
  const force = argv.includes('--force')
  const prepareDdl = argv.includes('--prepare-ddl')
  const dbIdx = argv.indexOf('--db')
  const dbArg = dbIdx >= 0 ? argv[dbIdx + 1] : undefined
  return { dryRun, force, prepareDdl, dbArg }
}

function resolveDbPath(dbArg?: string): string {
  if (dbArg) {
    return dbArg.startsWith('file:') ? dbArg.replace(/^file:/, '') : dbArg
  }
  throw new Error('Missing --db <path>. Refuse to use implicit DATABASE_URL (production risk).')
}

function assertMetaKeysMatchMigrationFile(sqlText: string) {
  const required = [
    META_KEYS_DAY1.DISCUSSION_SUBMITTED,
    META_KEYS_DAY1.SOURCE_FROM,
    META_KEYS_DAY1.PROPOSAL_ID_LEGACY,
    META_KEYS_DAY1.FROM_EVALUATE,
  ]
  for (const key of required) {
    if (!sqlText.includes(key)) {
      throw new Error(`migration.sql missing META_KEYS path "${key}" — stop fire`)
    }
  }
}

function loadSections(): Section[] {
  const raw = fs.readFileSync(MIGRATION_SQL_PATH, 'utf8')
  assertMetaKeysMatchMigrationFile(raw)
  const lines = raw.split('\n')
  const sections: Section[] = []
  let currentTag = ''
  let buf: string[] = []

  const flush = () => {
    const sql = buf.join('\n').trim()
    buf = []
    if (!sql || !currentTag) return
    const kind = sql.trimStart().toUpperCase().startsWith('SELECT') ? 'select' : 'update'
    sections.push({ tag: currentTag, sql, kind })
  }

  for (const line of lines) {
    const m = line.match(/^-- §([A-Z0-9_]+)/)
    if (m) {
      flush()
      currentTag = m[1]
      continue
    }
    if (line.startsWith('--') || !line.trim()) continue
    buf.push(line)
  }
  flush()
  return sections
}

function applyDdlSkeleton(db: Database.Database) {
  const ddl = fs.readFileSync(SKELETON_PATH, 'utf8')
  const statements = ddl
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('--'))
    .map(line => (line.endsWith(';') ? line : `${line};`))
  for (const stmt of statements) {
    db.exec(stmt.slice(0, -1))
  }
  console.log(`[day1] DDL skeleton applied (${statements.length} statements)`)
}

function hasDay1Columns(db: Database.Database): boolean {
  const cols = db.prepare(`PRAGMA table_info(Project)`).all() as { name: string }[]
  const names = new Set(cols.map(c => c.name))
  return names.has('proposalId') && names.has('writingStyle') && names.has('submittedToPlanningAt')
}

function dryRunCountSql(tag: string): string {
  const ds = META_PATHS.discussionSubmitted
  const sf = META_PATHS.sourceFrom
  const pid = META_PATHS.proposalIdLegacy
  const proposalLink = `(json_extract(metadata, '${sf}') = 'proposal' OR json_extract(metadata, '${pid}') IS NOT NULL OR EXISTS (SELECT 1 FROM Proposal p WHERE p.projectId = Project.id))`

  const counts: Record<string, string> = {
    A1: `SELECT COUNT(*) AS n FROM Proposal WHERE status = 'draft' AND (json_extract(metadata, '${ds}') IS NULL OR json_extract(metadata, '${ds}') = 0 OR json_extract(metadata, '${ds}') = false)`,
    A2: `SELECT COUNT(*) AS n FROM Proposal WHERE status IN ('submitted', 'evaluated') AND json_extract(metadata, '${ds}') = 1`,
    A3: `SELECT COUNT(*) AS n FROM Proposal WHERE status = 'rejected'`,
    B1: `SELECT COUNT(*) AS n FROM Project WHERE status = 'draft' AND ${proposalLink}`,
    B2: `SELECT COUNT(*) AS n FROM Project WHERE status = 'draft' AND NOT ${proposalLink}`,
    B3: `SELECT COUNT(*) AS n FROM Project WHERE status = 'completed'`,
    B_TS1: `SELECT COUNT(*) AS n FROM Project WHERE status IN ('writing', 'written', 'reviewing', 'reviewed') AND writingStartedAt IS NULL`,
    B_TS2: `SELECT COUNT(*) AS n FROM Project WHERE status IN ('archived', 'reviewed') AND archivedAt IS NULL`,
    C: `SELECT COUNT(*) AS n FROM Project WHERE writingStyle IS NULL AND json_extract(metadata, '$.writingStyle') IS NOT NULL`,
    D: `SELECT COUNT(*) AS n FROM Project WHERE proposalId IS NULL AND EXISTS (SELECT 1 FROM Proposal p WHERE p.projectId = Project.id OR p.id = json_extract(Project.metadata, '${pid}')) AND (json_extract(metadata, '${sf}') = 'proposal' OR json_extract(metadata, '${pid}') IS NOT NULL)`,
    E: `SELECT COUNT(*) AS n FROM Project WHERE proposalId IS NOT NULL AND json_extract(metadata, '${sf}') = 'proposal'`,
  }
  const sql = counts[tag]
  if (!sql) throw new Error(`No dry-run COUNT for §${tag}`)
  return sql
}

function runSection(
  db: Database.Database,
  section: Section,
  dryRun: boolean
): { tag: string; rows: number; mode: string } {
  if (section.kind === 'update') {
    if (dryRun) {
      const countSql = dryRunCountSql(section.tag)
      const row = db.prepare(countSql).get() as { n: number }
      console.log(`[day1] §${section.tag} dry-run would affect ${row.n} row(s)`)
      return { tag: section.tag, rows: row.n, mode: 'dry-run-count' }
    }
    const info = db.prepare(section.sql).run()
    console.log(`[day1] §${section.tag} applied ${info.changes} row(s)`)
    return { tag: section.tag, rows: info.changes, mode: 'apply' }
  }

  const rows = db.prepare(section.sql).all() as unknown[]
  console.log(`[day1] §${section.tag} select returned ${rows.length} row(s)`)
  if (rows.length > 0 && rows.length <= 20) {
    console.log(JSON.stringify(rows, null, 2))
  }
  return { tag: section.tag, rows: rows.length, mode: 'select' }
}

function main() {
  const { dryRun, force, prepareDdl, dbArg } = parseArgs(process.argv.slice(2))
  const dbPath = resolveDbPath(dbArg)

  if (dbPath.includes('data/novel.db')) {
    console.error('[day1] STOP: refusing --db pointing at data/novel.db (production path). Use /tmp replica.')
    process.exit(1)
  }

  if (!fs.existsSync(dbPath)) {
    console.error(`[day1] STOP: database not found: ${dbPath}`)
    process.exit(1)
  }

  console.log(`[day1] target=${dbPath} dryRun=${dryRun} force=${force} META_KEYS=${JSON.stringify(META_PATHS)}`)

  const db = new Database(dbPath)

  try {
    if (prepareDdl || !hasDay1Columns(db)) {
      if (!dryRun && !prepareDdl) {
        console.error('[day1] STOP: Day1 columns missing. Re-run with --prepare-ddl on replica only.')
        process.exit(1)
      }
      if (dryRun && !hasDay1Columns(db)) {
        applyDdlSkeleton(db)
        console.log('[day1] replica prepared with DDL for dry-run validation only')
      } else if (prepareDdl) {
        applyDdlSkeleton(db)
      }
    }

    const sections = loadSections()
    const results: { tag: string; rows: number; mode: string }[] = []

    for (const section of sections) {
      if (section.tag === 'F' || section.tag === 'G' || section.tag === 'ORPHAN') {
        const r = runSection(db, section, true)
        results.push(r)
        if (section.tag === 'F' && r.rows > 0 && !force) {
          console.warn('[day1] semi-migrated projects (§F)', r.rows)
          process.exit(1)
        }
        if (section.tag === 'G' && r.rows > 0 && !force) {
          console.warn('[day1] invariant failed: approved proposal without projectId', r.rows)
          process.exit(1)
        }
        continue
      }

      if (dryRun) {
        results.push(runSection(db, section, true))
      } else {
        results.push(runSection(db, section, false))
      }
    }

    console.log('[day1] summary', results)
    console.log('[day1] done')
  } finally {
    db.close()
  }
}

main()
