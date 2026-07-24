import { describe, it, expect } from '@jest/globals'

interface WorkSetting {
  charactersAndRelations: string
  timeAndPlace: string
  eventsAndPlot: string
  narrativeStyle: string
}

function isBlockFilled(val?: string): boolean {
  return typeof val === 'string' && val.trim().length > 0
}

function canReleaseToStudioLogic(metadata: Record<string, unknown> | null | undefined): {
  ready: boolean
  missing: string[]
} {
  const meta = metadata ?? {}
  const rawWs = (meta.workSetting as Partial<WorkSetting>) ?? {}
  const rawPlanning = (meta.chapterPlanning as unknown[]) ?? []

  const missing: string[] = []
  if (!isBlockFilled(rawWs.charactersAndRelations)) missing.push('人物与关系设定')
  if (!isBlockFilled(rawWs.timeAndPlace)) missing.push('时间与地点设定')
  if (!isBlockFilled(rawWs.eventsAndPlot)) missing.push('事件与情节设定')
  if (!Array.isArray(rawPlanning) || rawPlanning.length === 0) missing.push('至少 1 章章节大纲')

  return {
    ready: missing.length === 0,
    missing,
  }
}

describe('canReleaseToStudio planning release gate check', () => {
  it('returns ready: false and lists all missing items for empty metadata', () => {
    const res = canReleaseToStudioLogic({})
    expect(res.ready).toBe(false)
    expect(res.missing).toContain('人物与关系设定')
    expect(res.missing).toContain('时间与地点设定')
    expect(res.missing).toContain('事件与情节设定')
    expect(res.missing).toContain('至少 1 章章节大纲')
  })

  it('returns ready: false when partially filled', () => {
    const res = canReleaseToStudioLogic({
      workSetting: {
        charactersAndRelations: 'Protagonist and Antagonist relations',
        timeAndPlace: 'Cyberpunk Tokyo 2099',
      },
      chapterPlanning: [{ order: 1, title: 'Chapter 1', summary: 'Beginning' }],
    })
    expect(res.ready).toBe(false)
    expect(res.missing).toEqual(['事件与情节设定'])
  })

  it('returns ready: true when all 3 required settings and chapter planning are provided', () => {
    const res = canReleaseToStudioLogic({
      workSetting: {
        charactersAndRelations: 'Protagonist and Antagonist relations',
        timeAndPlace: 'Cyberpunk Tokyo 2099',
        eventsAndPlot: 'The main conflict unravels',
      },
      chapterPlanning: [{ order: 1, title: 'Chapter 1', summary: 'Beginning' }],
    })
    expect(res.ready).toBe(true)
    expect(res.missing).toEqual([])
  })
})
