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

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Backend returns { success: true, data: ... }
    // handleApiResponse unwraps 'data' if success is true
    return { ...response, data: handleApiResponse(response.data) }
  },
  (error) => {
    // handleApiError already returns Promise.reject(ApiError)
    // So we just return it directly, not wrap it again
    return handleApiError(error)
  }
)

// --- Type Definitions ---

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
  status: 'draft' | 'writing' | 'completed' | 'archived' | 'imported' | 'published'
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
  status?: string
  collectionId?: string
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
  async getAll(_collectionId?: string): Promise<Project[]> {
    // V2 return all (filtering not implemented)
    const response = await api.get('/projects')
    // No more manual JSON parsing needed!
    return (response.data || []).map((p: any) => ({
        ...p,
        tags: p.tags || [],
        metadata: p.metadata || {},
        genre: p.tags || [], // Mapping tags to genre for compatibility if needed
        status: p.status || 'draft'
    }))
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

  async update(id: string, data: Partial<Project>): Promise<Project> {
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
    return (response.data || []).filter((p: Project) => p.status === 'imported')
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
    return response.data
  },

  async getByProjectId(projectId: string): Promise<Scrap[]> {
    const response = await api.get(`/scraps/project/${projectId}`)
    return response.data
  },
  
  async create(data: { projectId?: string; content: string; tags?: string[]; note?: string }): Promise<Scrap> {
    const response = await api.post('/scraps', data)
    return response.data
  },

  async update(id: string, data: { content?: string; tags?: string[]; note?: string; projectId?: string }): Promise<Scrap> {
    const response = await api.put(`/scraps/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
     await api.delete(`/scraps/${id}`)
  }
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
