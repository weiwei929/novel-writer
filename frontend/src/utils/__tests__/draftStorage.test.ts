import { saveDraft, getDraft, clearDraft, hasUnsavedDraft } from '../draftStorage'

describe('draftStorage utility', () => {
  const pId = 'project-1'
  const cId = 'chapter-1'

  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and reads local draft correctly', () => {
    saveDraft(pId, cId, 'Draft content line 1')
    const draft = getDraft(pId, cId)
    expect(draft).not.toBeNull()
    expect(draft?.content).toBe('Draft content line 1')
    expect(typeof draft?.updatedAt).toBe('number')
  })

  it('detects unsaved draft when server content differs', () => {
    saveDraft(pId, cId, 'New local edits')
    const hasDraft = hasUnsavedDraft(pId, cId, 'Old server content')
    expect(hasDraft).toBe(true)
  })

  it('returns false for unsaved draft when content matches server', () => {
    saveDraft(pId, cId, 'Same content')
    const hasDraft = hasUnsavedDraft(pId, cId, 'Same content')
    expect(hasDraft).toBe(false)
  })

  it('clears draft properly', () => {
    saveDraft(pId, cId, 'Temporary text')
    clearDraft(pId, cId)
    const draft = getDraft(pId, cId)
    expect(draft).toBeNull()
  })
})
