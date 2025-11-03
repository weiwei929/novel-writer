import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 文集相关类型定义
export interface Collection {
  id: string
  name: string
  description?: string
  tags: string[]
  projectCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionData {
  name: string
  description?: string
  tags?: string[]
}

// 文集 API 服务
export const collectionsApi = {
  // 获取所有文集
  async getAll(): Promise<Collection[]> {
    const response = await api.get('/collections')
    return response.data
  },

  // 根据ID获取文集
  async getById(id: string): Promise<Collection> {
    const response = await api.get(`/collections/${id}`)
    return response.data
  },

  // 创建文集
  async create(data: CreateCollectionData): Promise<Collection> {
    const response = await api.post('/collections', data)
    return response.data
  },

  // 更新文集
  async update(id: string, data: Partial<Collection>): Promise<Collection> {
    const response = await api.put(`/collections/${id}`, data)
    return response.data
  },

  // 删除文集
  async delete(id: string): Promise<void> {
    await api.delete(`/collections/${id}`)
  },
}

// 项目相关类型定义
export interface Project {
  id: string
  title: string
  description?: string
  author: string
  genre: string[]
  tags: string[]
  status: 'draft' | 'writing' | 'completed' | 'published'
  collectionId?: string
  wordCount: number
  chapterCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectData {
  title: string
  description?: string
  author: string
  genre?: string[]
  tags?: string[]
  status?: string
  collectionId?: string
}

// 项目 API 服务
export const projectsApi = {
  // 获取所有项目或指定文集的项目
  async getAll(collectionId?: string): Promise<Project[]> {
    const url = collectionId ? `/projects?collectionId=${collectionId}` : '/projects'
    const response = await api.get(url)
    return response.data
  },

  // 根据ID获取项目
  async getById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  // 创建项目
  async create(data: CreateProjectData): Promise<Project> {
    const response = await api.post('/projects', data)
    return response.data
  },

  // 更新项目
  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
  },

  // 删除项目
  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },
}

// 统计 API 服务
export const statsApi = {
  async get() {
    const response = await api.get('/stats')
    return response.data
  },
}

// AI 服务
export const aiApi = {
  // 检查 AI 是否可用
  isAvailable(): boolean {
    // 这里可以从设置中检查
    try {
      return typeof window !== 'undefined' && 
             localStorage.getItem('novel-writer-settings') !== null &&
             JSON.parse(localStorage.getItem('novel-writer-settings') || '{}').aiEnabled === true
    } catch {
      return false
    }
  },

  // 测试 AI 连接
  async test() {
    if (!this.isAvailable()) {
      throw new Error('AI 功能未启用')
    }
    const response = await api.get('/ai/test')
    return response.data
  },

  // 生成内容
  async generate(data: {
    prompt: string
    context?: string
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
  }) {
    if (!this.isAvailable()) {
      throw new Error('AI 功能未启用')
    }
    const response = await api.post('/ai/generate', data)
    return response.data
  },

  // 获取写作建议
  async getWritingSuggestion(data: {
    content: string
    type?: 'continue' | 'improve' | 'brainstorm'
  }) {
    if (!this.isAvailable()) {
      throw new Error('AI 功能未启用')
    }
    const response = await api.post('/ai/writing-suggestion', data)
    return response.data
  },

  // 生成角色设定
  async generateCharacter(description: string) {
    if (!this.isAvailable()) {
      throw new Error('AI 功能未启用')
    }
    const response = await api.post('/ai/generate-character', { description })
    return response.data
  },
}

export default api