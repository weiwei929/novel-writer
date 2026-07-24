export interface LocalDraft {
  projectId: string
  chapterId: string
  content: string
  updatedAt: number
}

const DRAFT_PREFIX = 'novel_draft_'

function getDraftKey(projectId: string, chapterId: string): string {
  return `${DRAFT_PREFIX}${projectId}_${chapterId}`
}

/**
 * 自动保存本地离线草稿
 */
export function saveDraft(projectId: string, chapterId: string, content: string): void {
  if (!projectId || !chapterId) return
  try {
    const draft: LocalDraft = {
      projectId,
      chapterId,
      content,
      updatedAt: Date.now(),
    }
    localStorage.setItem(getDraftKey(projectId, chapterId), JSON.stringify(draft))
  } catch (err) {
    console.warn('[draftStorage] Failed to save draft to localStorage', err)
  }
}

/**
 * 读取本地指定章节草稿
 */
export function getDraft(projectId: string, chapterId: string): LocalDraft | null {
  if (!projectId || !chapterId) return null
  try {
    const raw = localStorage.getItem(getDraftKey(projectId, chapterId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraft
    if (parsed && typeof parsed.content === 'string' && typeof parsed.updatedAt === 'number') {
      return parsed
    }
  } catch (err) {
    console.warn('[draftStorage] Failed to parse draft from localStorage', err)
  }
  return null
}

/**
 * 清除已保存或已丢弃的本地草稿
 */
export function clearDraft(projectId: string, chapterId: string): void {
  if (!projectId || !chapterId) return
  try {
    localStorage.removeItem(getDraftKey(projectId, chapterId))
  } catch (err) {
    console.warn('[draftStorage] Failed to clear draft from localStorage', err)
  }
}

/**
 * 校验是否存在比服务端更新且内容不一致的草稿
 */
export function hasUnsavedDraft(
  projectId: string,
  chapterId: string,
  serverContent: string
): boolean {
  const draft = getDraft(projectId, chapterId)
  if (!draft) return false
  // 内容存在差异且草稿非空
  return draft.content !== serverContent && draft.content.trim().length > 0
}
