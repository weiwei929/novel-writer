const Database = require('better-sqlite3')
const db = new Database('D:/workspace/content/docs/novel-writer/.tmp-prisma-audit-final/migrated.db')
const col = db.prepare('PRAGMA table_info(Project)').all().find(r => r.name === 'proposalId')
console.log('proposalId:', col ? { type: col.type, notnull: col.notnull } : 'MISSING')
const idx = db
  .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='Project' AND name='Project_proposalId_key'")
  .get()
console.log('unique index:', idx?.name || 'MISSING')
const fk = db.prepare('PRAGMA foreign_key_list(Project)').all().find(f => f.from === 'proposalId')
console.log('FK:', fk ? { table: fk.table, on_delete: fk.on_delete } : 'MISSING')
const before = db.prepare('SELECT COUNT(*) as c FROM Project').get().c
db.prepare(
  "INSERT INTO Proposal (id, title, status, createdAt, updatedAt) VALUES ('p1', 'Prop', 'draft', datetime('now'), datetime('now'))"
).run()
db.prepare(
  "INSERT INTO Project (id, title, status, proposalId, wordCount, createdAt, updatedAt) VALUES ('j1', 'Proj', 'draft', 'p1', 0, datetime('now'), datetime('now'))"
).run()
console.log(
  'join:',
  db.prepare('SELECT p.id, p.proposalId, pr.title FROM Project p JOIN Proposal pr ON p.proposalId = pr.id WHERE p.id = ?').get('j1')
)
console.log('project count:', before, '->', db.prepare('SELECT COUNT(*) as c FROM Project').get().c)
db.close()
