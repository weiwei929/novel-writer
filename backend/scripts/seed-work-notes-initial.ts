/**
 * TASK-700-F — 存量作品初始快照（幂等，可重跑）
 * 用法：npx ts-node --transpile-only scripts/seed-work-notes-initial.ts
 */
import { PrismaClient } from '@prisma/client'
import { seedInitialWorkNotesForProject } from '../src/utils/workNote'

const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, metadata: true, description: true },
  })

  let totalInserted = 0
  for (const p of projects) {
    const n = await seedInitialWorkNotesForProject(
      prisma,
      p.id,
      (p.metadata as Record<string, unknown>) || {},
      p.description
    )
    totalInserted += n
    console.log(JSON.stringify({ id: p.id, title: p.title, inserted: n }))
  }

  const initialCount = await prisma.workNote.count({ where: { kind: 'initial' } })
  console.log(
    JSON.stringify({
      projects: projects.length,
      insertedThisRun: totalInserted,
      initialRowsTotal: initialCount,
    })
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
