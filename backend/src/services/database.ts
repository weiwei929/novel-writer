import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from 'path'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { Collection, Project, Chapter } from '../types/index'

interface DatabaseData {
  collections: Collection[]
  projects: Project[]
  chapters: Chapter[]
}

class DatabaseService {
  private db?: Low<DatabaseData>
  private readonly dataPath: string

  constructor(dataPath = './data') {
    this.dataPath = dataPath
  }

  async init(): Promise<void> {
    if (this.db) return

    if (!existsSync(this.dataPath)) {
      await mkdir(this.dataPath, { recursive: true })
    }

    const file = join(this.dataPath, 'database.json')
    const adapter = new JSONFile<DatabaseData>(file)
    this.db = new Low(adapter, {
      collections: [],
      projects: [],
      chapters: []
    })

    await this.db.read()
    await this.db.write()
    console.log(' Database initialized')
  }

  // 文集管理
  async createCollection(data: { name: string; description?: string; tags?: string[] }): Promise<Collection> {
    await this.init()
    await this.db!.read()

    const collection: Collection = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      tags: data.tags || [],
      projectCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.db!.data.collections.push(collection)
    await this.db!.write()
    return collection
  }

  async getCollections(): Promise<Collection[]> {
    await this.init()
    await this.db!.read()
    return this.db!.data.collections
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    await this.init()
    await this.db!.read()
    return this.db!.data.collections.find(c => c.id === id) || null
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | null> {
    await this.init()
    await this.db!.read()

    const collection = this.db!.data.collections.find(c => c.id === id)
    if (!collection) return null

    Object.assign(collection, updates, {
      id,
      updatedAt: new Date().toISOString()
    })

    await this.db!.write()
    return collection
  }

  async deleteCollection(id: string): Promise<boolean> {
    await this.init()
    await this.db!.read()

    const index = this.db!.data.collections.findIndex(c => c.id === id)
    if (index === -1) return false

    const hasProjects = this.db!.data.projects.some(p => p.collectionId === id)
    if (hasProjects) {
      throw new Error('Cannot delete collection with associated projects')
    }

    this.db!.data.collections.splice(index, 1)
    await this.db!.write()
    return true
  }

  // 项目管理
  async createProject(data: {
    title: string
    description?: string
    author: string
    genre?: string[]
    tags?: string[]
    status?: string
    collectionId?: string
  }): Promise<Project> {
    await this.init()
    await this.db!.read()

    const project: Project = {
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      author: data.author,
      genre: data.genre || [],
      tags: data.tags || [],
      status: (data.status as any) || 'draft',
      collectionId: data.collectionId || '',
      wordCount: 0,
      chapterCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.db!.data.projects.push(project)

    if (project.collectionId) {
      const collection = this.db!.data.collections.find(c => c.id === project.collectionId)
      if (collection) {
        collection.projectCount++
      }
    }

    await this.db!.write()
    return project
  }

  async getProjects(collectionId?: string): Promise<Project[]> {
    await this.init()
    await this.db!.read()

    if (collectionId) {
      return this.db!.data.projects.filter(p => p.collectionId === collectionId)
    }
    return this.db!.data.projects
  }

  async getProjectById(id: string): Promise<Project | null> {
    await this.init()
    await this.db!.read()
    return this.db!.data.projects.find(p => p.id === id) || null
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    await this.init()
    await this.db!.read()

    const project = this.db!.data.projects.find(p => p.id === id)
    if (!project) return null

    Object.assign(project, updates, {
      id,
      updatedAt: new Date().toISOString()
    })

    await this.db!.write()
    return project
  }

  async deleteProject(id: string): Promise<boolean> {
    await this.init()
    await this.db!.read()

    const projectIndex = this.db!.data.projects.findIndex(p => p.id === id)
    if (projectIndex === -1) return false

    const project = this.db!.data.projects[projectIndex]

    // 删除关联章节
    this.db!.data.chapters = this.db!.data.chapters.filter(c => c.projectId !== id)

    // 更新文集项目计数
    if (project.collectionId) {
      const collection = this.db!.data.collections.find(c => c.id === project.collectionId)
      if (collection) {
        collection.projectCount--
      }
    }

    this.db!.data.projects.splice(projectIndex, 1)
    await this.db!.write()
    return true
  }

  // 章节管理
  async createChapter(data: {
    title: string
    content?: string
    projectId: string
    order?: number
  }): Promise<Chapter> {
    await this.init()
    await this.db!.read()

    const project = this.db!.data.projects.find(p => p.id === data.projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const chapter: Chapter = {
      id: uuidv4(),
      title: data.title,
      content: data.content || '',
      projectId: data.projectId,
      order: data.order || this.db!.data.chapters.filter(c => c.projectId === data.projectId).length + 1,
      wordCount: data.content ? data.content.split(/\s+/).length : 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.db!.data.chapters.push(chapter)

    // 更新项目统计
    project.chapterCount++
    project.wordCount = this.db!.data.chapters
      .filter(c => c.projectId === data.projectId)
      .reduce((sum, c) => sum + c.wordCount, 0)

    await this.db!.write()
    return chapter
  }

  async getChapters(projectId: string): Promise<Chapter[]> {
    await this.init()
    await this.db!.read()
    return this.db!.data.chapters
      .filter(c => c.projectId === projectId)
      .sort((a, b) => a.order - b.order)
  }

  async getChapterById(id: string): Promise<Chapter | null> {
    await this.init()
    await this.db!.read()
    return this.db!.data.chapters.find(c => c.id === id) || null
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
    await this.init()
    await this.db!.read()

    const chapter = this.db!.data.chapters.find(c => c.id === id)
    if (!chapter) return null

    const oldWordCount = chapter.wordCount

    Object.assign(chapter, updates, {
      id,
      updatedAt: new Date().toISOString()
    })

    // 重新计算字数
    if (updates.content !== undefined) {
      chapter.wordCount = updates.content ? updates.content.split(/\s+/).length : 0
    }

    // 更新项目统计
    const project = this.db!.data.projects.find(p => p.id === chapter.projectId)
    if (project) {
      project.wordCount = project.wordCount - oldWordCount + chapter.wordCount
    }

    await this.db!.write()
    return chapter
  }

  async deleteChapter(id: string): Promise<boolean> {
    await this.init()
    await this.db!.read()

    const chapterIndex = this.db!.data.chapters.findIndex(c => c.id === id)
    if (chapterIndex === -1) return false

    const chapter = this.db!.data.chapters[chapterIndex]

    // 更新项目统计
    const project = this.db!.data.projects.find(p => p.id === chapter.projectId)
    if (project) {
      project.chapterCount--
      project.wordCount -= chapter.wordCount
    }

    this.db!.data.chapters.splice(chapterIndex, 1)
    await this.db!.write()
    return true
  }

  // 搜索功能
  async search(query: string, type?: 'collections' | 'projects' | 'chapters'): Promise<any> {
    await this.init()
    await this.db!.read()

    const searchTerm = query.toLowerCase()
    const results: any = {}

    if (!type || type === 'collections') {
      results.collections = this.db!.data.collections.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.description && c.description.toLowerCase().includes(searchTerm)) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    if (!type || type === 'projects') {
      results.projects = this.db!.data.projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        p.author.toLowerCase().includes(searchTerm) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        p.genre.some(genre => genre.toLowerCase().includes(searchTerm))
      )
    }

    if (!type || type === 'chapters') {
      results.chapters = this.db!.data.chapters.filter(c =>
        c.title.toLowerCase().includes(searchTerm) ||
        c.content.toLowerCase().includes(searchTerm)
      )
    }

    return results
  }

  // 统计信息
  async getStats() {
    await this.init()
    await this.db!.read()

    return {
      collections: this.db!.data.collections.length,
      projects: this.db!.data.projects.length,
      chapters: this.db!.data.chapters.length,
      totalWords: this.db!.data.projects.reduce((sum, p) => sum + p.wordCount, 0),
      lastUpdated: new Date().toISOString()
    }
  }
}

export const db = new DatabaseService()
export default DatabaseService
