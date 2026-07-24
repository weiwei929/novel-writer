import { describe, it, expect, beforeEach } from '@jest/globals'

interface LocalDraft {
  projectId: string
  chapterId: string
  content: string
  updatedAt: number
}

// 模拟 draftStorage 的核心离线比对算法逻辑
function hasUnsavedDraftLogic(
  draft: LocalDraft | null,
  serverContent: string
): boolean {
  if (!draft) return false
  return draft.content !== serverContent && draft.content.trim().length > 0
}

describe('draftStorage comparison logic', () => {
  const pId = 'project-1'
  const cId = 'chapter-1'

  it('detects unsaved draft when server content differs', () => {
    const draft: LocalDraft = {
      projectId: pId,
      chapterId: cId,
      content: 'New local edits',
      updatedAt: Date.now(),
    }
    const hasDraft = hasUnsavedDraftLogic(draft, 'Old server content')
    expect(hasDraft).toBe(true)
  })

  it('returns false for unsaved draft when content matches server', () => {
    const draft: LocalDraft = {
      projectId: pId,
      chapterId: cId,
      content: 'Same content',
      updatedAt: Date.now(),
    }
    const hasDraft = hasUnsavedDraftLogic(draft, 'Same content')
    expect(hasDraft).toBe(false)
  })

  it('returns false when draft is null', () => {
    const hasDraft = hasUnsavedDraftLogic(null, 'Some server content')
    expect(hasDraft).toBe(false)
  })
})
