import axios from 'axios'
import { handleApiResponse, handleApiError } from '../types/api'

const API_BASE_URL = '/api/v2'

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor — 携带认证 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('novel_auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Backend returns { success: true, data: ... }
    // handleApiResponse unwraps 'data' if success is true
    return { ...response, data: handleApiResponse(response.data) }
  },
  (error) => {
    // 401 → token 失效，清空并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('novel_auth_token')
      window.dispatchEvent(new CustomEvent('novel:auth-expired'))
      window.location.href = '/'
      return Promise.reject(error)
    }
    return handleApiError(error)
  }
)

// --- Type Definitions ---

// ===== 状态枚举（唯一源） =====
export const PROJECT_STATUSES = [
  'draft',
  'planning',
  'writing',
  'reviewing',
  'completed',
  'archived',
  'shelved',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROPOSAL_STATUSES = [
  'draft',
  'submitted',
  'evaluated',
  'approved',
  'rejected',
  'shelved',
] as const

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  planning: '企划中',
  writing: '创作中',
  reviewing: '审阅中',
  completed: '已完成',
  archived: '已归档',
  shelved: '作品暂存',
}

export const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  evaluated: '已评估',
  approved: '已立项',
  rejected: '已驳回',
  shelved: '作品暂存',
}

export const getStatusLabel = (status: string): string =>
  PROJECT_STATUS_LABEL[status] || status

// Type definitions
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: number
    message: string
  }
}

export interface Collection {
  id: string
  name: string
  description?: string
  projects?: Project[]
  /** Client-normalized from API `_count.projects` */
  projectCount?: number
  /** UI-only legacy field; backend does not persist collection tags */
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionData {
  name: string
  description?: string
  tags?: string[]
}

export interface Project {
  id: string
  title: string
  description?: string
  author: string
  status: ProjectStatus
  collectionId?: string 
  wordCount: number
  chapterCount?: number 
  createdAt: string
  updatedAt: string
  coverImage?: string
  metadata?: Record<string, any> // Now natively JSON object
  genre?: string[]
  tags?: string[] // Now natively JSON array
  masterPrompt?: string
}

export interface CreateProjectData {
  title: string
  description?: string
  author: string
  status?: ProjectStatus
  genre?: string[]
  tags?: string[]
  masterPrompt?: string
}

export interface Chapter {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  wordCount: number
  status: 'draft' | 'writing' | 'completed'
  createdAt: string
  updatedAt: string
  summary?: string
  metadata?: Record<string, any>
  notes?: string // Mapped from metadata.notes
}

export interface ChapterPlanItem {
  id: string
  order: number
  title: string
  plannedLength: number
  synopsisText?: string
  keyPlotPoints?: string[]
  status: 'planned' | 'started' | 'completed'
}

export interface CreateChapterData {
  projectId: string
  title: string
  content?: string
  notes?: string
  order?: number
}

export interface Scrap {
  id: string
  projectId?: string
  content: string
  note?: string
  tags?: string[] | string // Can be array or string depending on usage, DB is Json
  originalChapterId?: string
  project?: { title: string }   // Included via backend `include`
  createdAt: string
}

export type ExternalRefProcessingType = 'complete' | 'partial' | 'none'

export interface ExternalRefAnnotation {
  paragraphIndex: number
  content: string
  note?: string
  tags?: string[]
}

export interface FileReference {
  id: string
  fileName: string
  fileContent?: string | null
  fileType: string
  sourceUrl?: string | null
  processingType: ExternalRefProcessingType
  proposalId?: string | null
  annotations: ExternalRefAnnotation[]
  comment?: string | null
  tags: string[]
  metadata?: {
    title?: string
    paragraphs?: string[]
    paragraphCount?: number
  }
  createdAt: string
  updatedAt: string
}

function normalizeScrapTags(tags: unknown): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean)
  if (typeof tags === 'string') {
    return tags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean)
  }
  return []
}

function mapScrap(s: Scrap & { tags?: unknown }): Scrap {
  return { ...s, tags: normalizeScrapTags(s.tags) }
}

// --- 作品设定（TASK-006 后端 / TASK-007 前端 / TASK-008 双锚点）---
// 内部标识符沿用 world/Character 等命名；用户可见 UI 标签统一为「作品设定」

// 数据归属：提案阶段挂 proposalId，立项后挂 projectId
export type WorldScope = { type: 'proposal' | 'project'; id: string }

export interface WorldCharacter {
  id: string
  projectId?: string | null
  proposalId?: string | null
  name: string
  gender?: string | null
  age?: string | null
  identity?: string | null
  appearance?: string | null
  personality?: string | null
  interests?: string | null
  roleType?: string | null
  experience?: string | null
  keyRelations?: string | null
  catchphrase?: string | null
  // 旧字段保留（不在 UI 中展示/编辑）
  role?: string | null
  description?: string | null
  profile?: any
  createdAt: string
  updatedAt: string
}

export interface TimelineEntry {
  id: string
  projectId?: string | null
  proposalId?: string | null
  time: string
  location: string
  characters: string
  premise?: string | null
  process?: string | null
  outcome?: string | null
  narrativeMode?: string | null
  emotionStage?: string | null
  notes?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreativeFlow {
  id: string
  projectId?: string | null
  proposalId?: string | null
  title: string
  content: string
  tags?: string[] | null
  createdAt: string
  updatedAt: string
}

// 表单输入（不含归属字段，归属由 scope 注入）
export type CharacterInput = {
  name: string
  gender?: string | null
  age?: string | null
  identity?: string | null
  appearance?: string | null
  personality?: string | null
  interests?: string | null
  roleType?: string | null
  experience?: string | null
  keyRelations?: string | null
  catchphrase?: string | null
  role?: string | null
  description?: string | null
  profile?: any
}
export type TimelineInput = {
  time: string
  location: string
  characters: string
  premise?: string | null
  process?: string | null
  outcome?: string | null
  narrativeMode?: string | null
  emotionStage?: string | null
  notes?: string | null
  sortOrder?: number
}
export type CreativeFlowInput = {
  title: string
  content: string
  tags?: string[] | null
}

// 企划建议书（TASK-008 后端已实现）
export interface ProposalReference {
  type: 'scrap' | 'file_ref'
  id: string
  title: string
  processingType?: 'complete' | 'partial' | 'none'
  paragraphIndices?: number[]
}

export interface ProposalMetadata {
  _evaluation?: string
  _tags?: string[]
  _discussionSubmitted?: boolean
  _sourceRef?: { type: string; id: string; title?: string }
  _rejectNote?: string
  _shelveNote?: string
}

export interface Proposal {
  id: string
  title: string
  synopsis?: string | null
  innovation?: string | null
  coreSetting?: string | null
  status: ProposalStatus
  references?: ProposalReference[] | null
  sourceNotes?: string | null
  metadata?: ProposalMetadata | null
  projectId?: string | null
  createdAt: string
  updatedAt: string
}

export type ProposalInput = {
  title: string
  synopsis?: string | null
  innovation?: string | null
  coreSetting?: string | null
  references?: ProposalReference[]
  sourceNotes?: string | null
  metadata?: ProposalMetadata
  status?: ProposalStatus
}

export function getProposalMetadata(p: Proposal): ProposalMetadata {
  let meta: unknown = p.metadata
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta) as ProposalMetadata
    } catch {
      meta = {}
    }
  }
  return (meta && typeof meta === 'object' ? meta : {}) as ProposalMetadata
}

export interface WorkDetailResponse {
  project: Project
  chapters: Chapter[]
  characters: WorldCharacter[]
  timelineEntries: TimelineEntry[]
  creativeFlows: CreativeFlow[]
  proposal?: Proposal
}

export const workApi = {
  async getDetail(id: string): Promise<WorkDetailResponse> {
    const response = await api.get(`/work/${id}`)
    return response.data
  },
}

export const collectionsApi = {
  async getAll(): Promise<Collection[]> {
    const response = await api.get('/collections')
    return (response.data || []).map((c: any) => ({
      ...c,
      tags: c.tags || [],
      projectCount: c._count?.projects || c.projectCount || 0
    }))
  },
  async getById(id: string): Promise<Collection> {
      const response = await api.get(`/collections/${id}`)
      const c = response.data
      return {
        ...c,
        tags: c.tags || [],
        projectCount: c._count?.projects ?? c.projects?.length ?? c.projectCount ?? 0,
      }
  },
  async create(data: { name: string; description?: string; tags?: string[] }): Promise<Collection> {
      const response = await api.post('/collections', data)
      return response.data
  },

  async update(id: string, data: { name?: string; description?: string; tags?: string[] }): Promise<Collection> {
      const response = await api.put(`/collections/${id}`, data)
      return response.data
  },

  async delete(id: string): Promise<void> {
      await api.delete(`/collections/${id}`)
  }
}

export const projectsApi = {
  async getAll(_collectionId?: string, status?: string): Promise<Project[]> {
    const url = status ? `/projects?status=${encodeURIComponent(status)}` : '/projects'
    const response = await api.get(url)
    return (response.data || []).map((p: any) => ({
        ...p,
        tags: p.tags || [],
        metadata: p.metadata || {},
        genre: p.tags || [],
        status: p.status || 'draft',
        chapterCount: p.chapterCount ?? p._count?.chapters ?? 0,
        collectionId: p.collectionId ?? undefined,
    }))
  },

  async getLibraryProjects(): Promise<Project[]> {
    return this.getAll(undefined, 'completed,archived')
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`)
    const p = response.data
    return {
        ...p,
        tags: p.tags || [],
        metadata: p.metadata || {}
    }
  },

  async create(data: Partial<Project>): Promise<Project> {
    const response = await api.post('/projects', data)
    return response.data
  },

  async update(
    id: string,
    data: Omit<Partial<Project>, 'collectionId'> & { collectionId?: string | null }
  ): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },

  async importProject(data: { content: string; createdAt?: string }): Promise<Project> {
    const response = await api.post('/projects/import', data)
    return response.data
  },

  async exportProject(id: string): Promise<Blob> {
    const response = await api.get(`/projects/${id}/export`, { responseType: 'blob' })
    return response.data
  },

  async confirmMetadata(id: string, confirmed: boolean, editedMetadata?: Record<string, any>): Promise<void> {
    await api.post(`/projects/${id}/confirm-metadata`, { confirmed, editedMetadata })
  },

  async moveToDraft(id: string): Promise<Project> {
    const response = await api.post(`/projects/${id}/move-to-draft`)
    return response.data
  },

  async getImported(): Promise<Project[]> {
    const response = await api.get('/projects')
    return (response.data || []).filter((p: Project) => p.status === 'draft')
  },

  async extractMetadata(id: string): Promise<{ hasPendingMetadata: boolean }> {
    const response = await api.post(`/projects/${id}/extract-metadata`)
    return response.data
  },

  async updateMetadata(projectId: string, field: string, content: string) {
      try {
        const project = await this.getById(projectId)
        const meta = project.metadata || {}
        meta[field] = content
        return await this.update(projectId, { metadata: meta })
      } catch (e) {
        console.warn('Failed to update project metadata', e)
        return {}
      }
  },

  async getChapterPlanning(projectId: string): Promise<ChapterPlanItem[]> {
    const response = await api.get(`/projects/${projectId}/chapter-planning`)
    return response.data || []
  },

  async updateChapterPlanning(projectId: string, plans: ChapterPlanItem[]): Promise<ChapterPlanItem[]> {
    const response = await api.put(`/projects/${projectId}/chapter-planning`, plans)
    return response.data
  },

  async shelve(id: string, source?: string): Promise<Project> {
    const response = await api.post(`/projects/${id}/shelve`, { source })
    return response.data
  },

  async restore(id: string): Promise<Project> {
    const response = await api.post(`/projects/${id}/restore`)
    return response.data
  },

  async transition(id: string, to: string, note?: string): Promise<Project> {
    const response = await api.post(`/projects/${id}/transition`, { to, note })
    return response.data
  },

  async getShelved(): Promise<Project[]> {
    return this.getAll(undefined, 'shelved')
  },
}

export const chaptersApi = {
  async getByProjectId(projectId: string): Promise<Chapter[]> {
    const response = await api.get(`/chapters/project/${projectId}`)
    return (response.data || []).map((c: any) => ({
        ...c,
        metadata: c.metadata || {},
        notes: c.metadata?.notes || ''
    }))
  },

  async getById(id: string): Promise<Chapter> {
    const response = await api.get(`/chapters/${id}`)
    const c = response.data
    return {
        ...c,
        metadata: c.metadata || {},
        notes: c.metadata?.notes || ''
    }
  },

  async create(data: { projectId: string; title: string; content?: string; order?: number; notes?: string; summary?: string }): Promise<Chapter> {
    const payload = { ...data, metadata: { notes: data.notes } }
    const response = await api.post('/chapters', payload)
     const c = response.data
    return {
        ...c,
        metadata: c.metadata || {},
        notes: c.metadata?.notes || ''
    }
  },

  async update(id: string, data: Partial<Chapter> & { notes?: string }): Promise<Chapter> {
    let payload = { ...data }
    if (data.notes !== undefined) {
         // Merge notes into metadata
         const current = await this.getById(id)
         const meta = { ...(current.metadata || {}), notes: data.notes }
         payload.metadata = meta
    }
    const response = await api.put(`/chapters/${id}`, payload)
    const c = response.data
    return {
        ...c,
        metadata: c.metadata || {},
        notes: c.metadata?.notes || ''
    }
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/chapters/${id}`)
  },

  async updateMetadata(chapterId: string, field: string, content: string) {
    if (field === 'synopsis') {
       return await this.update(chapterId, { summary: content })
    }
    try {
        const chapter = await this.getById(chapterId)
        const meta = chapter.metadata || {}
        meta[field] = content;
        return await this.update(chapterId, { metadata: meta })
    } catch (e) { return {} }
  },

  async createForProject(projectId: string, data: Omit<CreateChapterData, 'projectId'>): Promise<Chapter> {
      return this.create({ ...data, projectId })
  },
  
  async getByProject(projectId: string) {
      return this.getByProjectId(projectId)
  }
}

export const scrapsApi = {
  async getAll(): Promise<Scrap[]> {
    const response = await api.get('/scraps')
    const list = Array.isArray(response.data) ? response.data : []
    return list.map(mapScrap)
  },

  async getByProjectId(projectId: string): Promise<Scrap[]> {
    const response = await api.get(`/scraps/project/${projectId}`)
    const list = Array.isArray(response.data) ? response.data : []
    return list.map(mapScrap)
  },

  async create(data: { projectId?: string; content: string; tags?: string[]; note?: string }): Promise<Scrap> {
    const response = await api.post('/scraps', data)
    return mapScrap(response.data)
  },

  async update(id: string, data: { content?: string; tags?: string[]; note?: string; projectId?: string }): Promise<Scrap> {
    const response = await api.put(`/scraps/${id}`, data)
    return mapScrap(response.data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/scraps/${id}`)
  },
}

export const externalRefsApi = {
  async importFile(fileName: string, content: string): Promise<FileReference> {
    const response = await api.post('/external-refs/import', { fileName, content })
    return response.data
  },

  async getAll(params?: { tag?: string }): Promise<FileReference[]> {
    const url = params?.tag
      ? `/external-refs?tag=${encodeURIComponent(params.tag)}`
      : '/external-refs'
    const response = await api.get(url)
    return Array.isArray(response.data) ? response.data : []
  },

  async getById(id: string): Promise<FileReference> {
    const response = await api.get(`/external-refs/${id}`)
    return response.data
  },

  async update(id: string, data: Partial<FileReference>): Promise<FileReference> {
    const response = await api.put(`/external-refs/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/external-refs/${id}`)
  },
}


// 作品设定 API（对接 /characters /timeline /creative-flows，支持 proposalId/projectId 双锚点）
const scopeQuery = (scope: WorldScope) =>
  scope.type === 'proposal'
    ? `proposalId=${encodeURIComponent(scope.id)}`
    : `projectId=${encodeURIComponent(scope.id)}`

export const scopeToOwner = (
  scope: WorldScope
): { projectId?: string; proposalId?: string } =>
  scope.type === 'proposal' ? { proposalId: scope.id } : { projectId: scope.id }

export const worldApi = {
  chars: {
    async list(scope: WorldScope): Promise<WorldCharacter[]> {
      const response = await api.get(`/characters/list?${scopeQuery(scope)}`)
      return response.data || []
    },
    async getById(id: string): Promise<WorldCharacter> {
      const response = await api.get(`/characters/${id}`)
      return response.data
    },
    async create(scope: WorldScope, data: CharacterInput): Promise<WorldCharacter> {
      const response = await api.post('/characters', { ...data, ...scopeToOwner(scope) })
      return response.data
    },
    async update(id: string, data: Partial<CharacterInput>): Promise<WorldCharacter> {
      const response = await api.put(`/characters/${id}`, data)
      return response.data
    },
    async delete(id: string): Promise<void> {
      await api.delete(`/characters/${id}`)
    },
  },
  timeline: {
    async list(scope: WorldScope): Promise<TimelineEntry[]> {
      const response = await api.get(`/timeline/list?${scopeQuery(scope)}`)
      return response.data || []
    },
    async getById(id: string): Promise<TimelineEntry> {
      const response = await api.get(`/timeline/${id}`)
      return response.data
    },
    async create(scope: WorldScope, data: TimelineInput): Promise<TimelineEntry> {
      const response = await api.post('/timeline', { ...data, ...scopeToOwner(scope) })
      return response.data
    },
    async update(id: string, data: Partial<TimelineInput>): Promise<TimelineEntry> {
      const response = await api.put(`/timeline/${id}`, data)
      return response.data
    },
    async delete(id: string): Promise<void> {
      await api.delete(`/timeline/${id}`)
    },
  },
  flows: {
    async list(scope: WorldScope): Promise<CreativeFlow[]> {
      const response = await api.get(`/creative-flows/list?${scopeQuery(scope)}`)
      return response.data || []
    },
    async getById(id: string): Promise<CreativeFlow> {
      const response = await api.get(`/creative-flows/${id}`)
      return response.data
    },
    async create(scope: WorldScope, data: CreativeFlowInput): Promise<CreativeFlow> {
      const response = await api.post('/creative-flows', { ...data, ...scopeToOwner(scope) })
      return response.data
    },
    async update(id: string, data: Partial<CreativeFlowInput>): Promise<CreativeFlow> {
      const response = await api.put(`/creative-flows/${id}`, data)
      return response.data
    },
    async delete(id: string): Promise<void> {
      await api.delete(`/creative-flows/${id}`)
    },
  },
}

// 企划建议书 API（TASK-008 后端：/api/v2/proposals）
export const proposalsApi = {
  async getAll(params?: { status?: string }): Promise<Proposal[]> {
    const url = params?.status
      ? `/proposals?status=${encodeURIComponent(params.status)}`
      : '/proposals'
    const response = await api.get(url)
    return Array.isArray(response.data) ? response.data : []
  },

  async list(): Promise<Proposal[]> {
    return this.getAll()
  },

  async getById(id: string): Promise<Proposal> {
    const response = await api.get(`/proposals/${id}`)
    return response.data
  },

  async create(data: ProposalInput): Promise<Proposal> {
    const response = await api.post('/proposals', data)
    return response.data
  },

  async update(id: string, data: Partial<ProposalInput>): Promise<Proposal> {
    const response = await api.put(`/proposals/${id}`, data)
    return response.data
  },

  async updateStatus(id: string, status: Proposal['status']): Promise<Proposal> {
    const response = await api.put(`/proposals/${id}/status`, { status })
    return response.data
  },

  async evaluate(
    id: string,
    action: 'approve' | 'reject' | 'shelve',
    note?: string
  ): Promise<{ projectId?: string; proposal?: Proposal }> {
    const response = await api.put(`/proposals/${id}/evaluate`, { action, note })
    return response.data
  },

  async approve(id: string): Promise<{ projectId: string; project?: Project }> {
    const response = await api.put(`/proposals/${id}/approve`)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/proposals/${id}`)
  },
}

export const settingsApi = {
  get: () => api.get<ApiResponse<any>>('/settings').then(res => res.data),
  update: (data: any) => api.put<ApiResponse<any>>('/settings', data).then(res => res.data),
}

export const aiApi = {
  async checkStatus(): Promise<{ status: string, provider: string }> {
      try {
        const response = await api.get('/ai/status')
        return response.data
      } catch (e) {
        return { status: 'unavailable', provider: 'none' }
      }
  },

  async chat(messages: { role: string, content: string }[], options?: { projectId?: string, chapterId?: string,  contextType?: 'chat' | 'writing' | 'global' | 'chapter_review', writingType?: string, currentContent?: string }): Promise<string> {
      const payload = { messages, ...options };
      const response = await api.post<{ content: string }>('/ai/chat', payload)
      return response.data.content
  },

  async generate(data: {
    prompt: string
    context?: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    projectId?: string
  }): Promise<ApiResponse<{ content: string }>> {
    try {
      // Check if context is just a string or more complex?
      // For now, mapping to chat structure
      const response = await api.post('/ai/chat', {
        messages: [
          ...(data.systemPrompt ? [{ role: 'system', content: data.systemPrompt }] : []),
          ...(data.context ? [{ role: 'user', content: `Context: ${data.context}` }] : []),
          { role: 'user', content: data.prompt }
        ],
        projectId: data.projectId,
        contextType: 'chat'
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'AI request failed'
        }
      }
    }
  },

  // ... (generateOutline and reviewChapter can remain for now, or update if Outline generation needs Tier A)

  async getWritingSuggestion(data: { content: string, type: 'continue' | 'improve' | 'brainstorm', chapterId?: string }) { 
      // No manual system prompt here if using backend context manager?
      // For now, let's keep basic system prompt as fallback or override?
      // Actually PromptManager handles system prompt now.
      // But we still need to pass user message.
      
      const payload = {
          messages: [{ role: 'user', content: data.content }], // Or empty if content is sent as currentContent parameter?
          // If type is continue, user message is empty? 
          // PromptManager logic:
          // getWritingSystemPrompt uses `currentContent`.
          // System prompt says "Output ONLY continuation".
          // So user message might just be "Continue" or empty.
          // Let's pass content as `currentContent` param, and user message as empty or instruction.
          
          chapterId: data.chapterId,
          contextType: 'writing' as const,
          writingType: data.type,
          currentContent: data.content
      };

      try {
        // If chapterId is missing (e.g. new file), PromptManager won't work.
        // Fallback to client-side prompt logic?
        if (!data.chapterId) {
             let systemPrompt = 'You are a helpful writing assistant.'
             if (data.type === 'continue') systemPrompt = 'You are a co-writer. Continue the story naturally from the provided text.'
             if (data.type === 'improve') systemPrompt = 'You are an editor. Improve the provided text for clarity and style.'
             if (data.type === 'brainstorm') systemPrompt = 'You are a creative muse. Provide 3 interesting plot twists or ideas based on the text.'
             
             const content = await this.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: data.content }
             ]);
             return { success: true, data: { suggestion: content } }
        }

        // Use new Backend Context Logic
        // We pass empty user message because SystemPrompt + Context handles everything.
        // Actually, for 'continue', we might want user message to be "Continue from: ..."
        // But PromptManager appends content to Context.
        // Let's just send a dummy user trigger.
        const content = await this.chat(
            [{ role: 'user', content: 'Please proceed based on context.' }], 
            payload
        )
        return { success: true, data: { suggestion: content } }
      } catch (error: any) {
        return { 
            success: false, 
            error: { code: 500, message: 'Failed to get suggestion' }
        }
      }
  },

  async generateCharacter(projectId: string, description: string): Promise<ApiResponse<{ character: string }>> { 
      try {
        const response = await api.post('/ai/generate/character', { projectId, description });
        return { success: true, data: response.data.data };
      } catch (error: any) {
        return {
          success: false,
          error: {
            code: error.response?.status || 500,
            message: error.response?.data?.error || 'Character generation failed'
          }
        }
      }
  },

  async generateOutline(projectId: string, prompt: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/ai/generate/outline', { projectId, prompt });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'Outline generation failed'
        }
      };
    }
  },

  async reviewGlobal(projectId: string): Promise<ApiResponse<{ report: string }>> {
    try {
      const response = await api.post('/ai/review/global', { projectId });
      // response.data is already unwrapped by handleApiResponse
      // Backend returns: { success: true, data: { report: "..." } }
      // After handleApiResponse: { report: "..." }
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'Global review failed'
        }
      };
    }
  },

  async reviewChapter(chapterId: string, content: string): Promise<ApiResponse<{ report: string }>> {
    try {
      const response = await api.post('/ai/review/chapter', { chapterId, content });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'Chapter review failed'
        }
      };
    }
  },

  // ===== AI 元数据助手 (NEW) =====
  
  async metadataChat(data: {
    type: 'project' | 'chapter'
    entityId: string
    field: string
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    userMessage: string
  }): Promise<ApiResponse<{ content: string }>> {
    try {
      const response = await api.post('/ai/metadata/chat', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'Metadata chat failed'
        }
      }
    }
  },

  async metadataExtract(data: {
    type: 'project' | 'chapter'
    entityId: string
    content: string
  }): Promise<ApiResponse<{ extractedMetadata: string }>> {
    try {
      const response = await api.post('/ai/metadata/extract', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'Metadata extraction failed'
        }
      }
    }
  },

  // ===== AI 章节大纲生成 (NEW) =====
  
  async generateChapterOutline(data: {
    projectId: string
    chapterCount?: number
    userRequirements?: string
  }): Promise<ApiResponse<{ outline: any }>> {
    try {
      const response = await api.post('/ai/chapters/generate-outline', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.status || 500,
          message: error.response?.data?.error || 'Chapter outline generation failed'
        }
      }
    }
  },

  async testConnection(): Promise<{ success: boolean; message?: string; provider?: string; model?: string; error?: string; details?: string }> {
    try {
      const response = await api.post('/ai/test-connection');
      // handleApiResponse unwraps { success: true, data: {...} } to just {...}
      return {
        success: true,
        ...response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'API 连接失败',
        details: error.details || error.toString()
      };
    }
  }
}

export const statsApi = {
  async get() {
    // Mock implementation using projects aggregation or endpoint if available
    try {
        const projects = await projectsApi.getAll()
        const collections = await collectionsApi.getAll()
        const totalWords = projects.reduce((acc, p) => acc + (p.wordCount || 0), 0)
        const chaptersCount = projects.reduce((acc, p) => acc + (p.chapterCount || 0), 0)
        
        return {
            collections: collections.length,
            projects: projects.length,
            chapters: chaptersCount,
            totalWords: totalWords,
            lastUpdated: new Date().toISOString()
        }
    } catch (e) {
        console.error("Stats aggregation failed", e)
        return { collections: 0, projects: 0, chapters: 0, totalWords: 0, lastUpdated: new Date().toISOString() }
    }
  }
}

export default api
