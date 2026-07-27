import { describe, it, expect, beforeEach, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import {
  buildOriginContent,
  extractTrackedFields,
  recordWorkNoteDiff,
  seedInitialWorkNotesForProject,
  serializeChapterPlanningContent,
} from '../../utils/workNote'

const prisma = new PrismaClient()

describe('workNote serialization and origin', () => {
  it('serializeChapterPlanningContent is stable regardless of input key order', () => {
    const a = serializeChapterPlanningContent([
      { synopsisText: 's2', title: 'B', order: 2 },
      { order: 1, title: 'A', summary: 's1' },
    ])
    const b = serializeChapterPlanningContent([
      { order: 1, title: 'A', summary: 's1' },
      { order: 2, title: 'B', summary: 's2' },
    ])
    expect(a).toBe(b)
    expect(a).toBe(
      JSON.stringify([
        { order: 1, title: 'A', summary: 's1' },
        { order: 2, title: 'B', summary: 's2' },
      ])
    )
    expect(serializeChapterPlanningContent([])).toBe('')
  })

  it('buildOriginContent includes title, synopsis, _sourceNote', () => {
    const text = buildOriginContent({
      title: '美丽的一天',
      synopsis: '一个故事',
      metadata: { _sourceNote: '来自灵感碎片：晨光' },
    })
    expect(text).toContain('标题：美丽的一天')
    expect(text).toContain('梗概：一个故事')
    expect(text).toContain('来源：来自灵感碎片：晨光')
  })

  it('extractTrackedFields reads workSetting blocks and synopsis', () => {
    const snap = extractTrackedFields(
      {
        synopsis: '梗概A',
        workSetting: {
          charactersAndRelations: '人',
          timeAndPlace: '地',
          eventsAndPlot: '事',
          narrativeStyle: '风',
        },
        chapterPlanning: [{ order: 1, title: '一', summary: '概' }],
      },
      null
    )
    expect(snap.synopsis).toBe('梗概A')
    expect(snap.charactersAndRelations).toBe('人')
    expect(snap.chapterPlanning).toBe(
      JSON.stringify([{ order: 1, title: '一', summary: '概' }])
    )
  })
})

describe('workNote record + initial seed (sqlite)', () => {
  let projectId: string

  beforeEach(async () => {
    const p = await prisma.project.create({
      data: {
        title: `worknote-test-${Date.now()}`,
        status: 'planning',
        metadata: {
          synopsis: '初稿梗概',
          workSetting: {
            charactersAndRelations: '角色',
            timeAndPlace: '地点',
            eventsAndPlot: '事件',
            narrativeStyle: '',
          },
          chapterPlanning: [{ order: 1, title: '一', summary: '概' }],
        },
      },
    })
    projectId = p.id
  })

  afterAll(async () => {
    await prisma.workNote.deleteMany({
      where: { project: { title: { startsWith: 'worknote-test-' } } },
    })
    await prisma.project.deleteMany({
      where: { title: { startsWith: 'worknote-test-' } },
    })
    await prisma.$disconnect()
  })

  it('dedupes identical content on second recordWorkNoteDiff', async () => {
    const before = extractTrackedFields({}, null)
    const after = extractTrackedFields(
      {
        synopsis: '初稿梗概',
        workSetting: {
          charactersAndRelations: '角色',
          timeAndPlace: '地点',
          eventsAndPlot: '事件',
          narrativeStyle: '',
        },
        chapterPlanning: [{ order: 1, title: '一', summary: '概' }],
      },
      null
    )
    const n1 = await recordWorkNoteDiff(prisma, projectId, before, after)
    expect(n1).toBeGreaterThan(0)
    const n2 = await recordWorkNoteDiff(prisma, projectId, after, after)
    expect(n2).toBe(0)
  })

  it('seedInitial is idempotent across two runs', async () => {
    const meta = {
      synopsis: '初稿梗概',
      workSetting: {
        charactersAndRelations: '角色',
        timeAndPlace: '地点',
        eventsAndPlot: '事件',
        narrativeStyle: '风格',
      },
      chapterPlanning: [{ order: 1, title: '一', summary: '概' }],
    }
    const a = await seedInitialWorkNotesForProject(prisma, projectId, meta, null)
    const b = await seedInitialWorkNotesForProject(prisma, projectId, meta, null)
    expect(a).toBeGreaterThan(0)
    expect(b).toBe(0)
    const initials = await prisma.workNote.count({
      where: { projectId, kind: 'initial' },
    })
    expect(initials).toBe(a)
  })
})
