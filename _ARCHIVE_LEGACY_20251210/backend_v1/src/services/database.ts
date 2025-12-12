import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from 'path'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { Collection, Project, Chapter } from '../types/index.js'
import { MetadataItem, SavedVersion } from '../types/metadata.js'

interface DatabaseData {
  collections: Collection[]
  projects: Project[]
  chapters: Chapter[]
}

class DatabaseService {
  private db?: Low<DatabaseData>
  private readonly dataPath: string

  private createDefaultMetadataItem(): MetadataItem {
    const now = new Date().toISOString()
    return {
      current: '',
      versions: [],
      lastModified: now,
      wordCount: 0,
    }
  }

  private ensureProjectMetadata(p: any) {
    if (!p.metadata) p.metadata = {}
    const projectFields = [
      'synopsis',
      'characters',
      'timeline',
      'settings',
      'relationships',
      'plotStructure',
    ]
    for (const f of projectFields) {
      if (!p.metadata[f]) p.metadata[f] = this.createDefaultMetadataItem()
    }
    // 兼容旧数据：若曾把 chapterPlanning 作为 MetadataItem 写入元数据，清理掉
    if (p.metadata.chapterPlanning) {
      delete p.metadata.chapterPlanning
    }
    // 确保章节规划数组存在（Project 级别结构化数据，非 MetadataItem）
    if (!Array.isArray(p.chapterPlanning)) p.chapterPlanning = []
  }

  private ensureChapterMetadata(c: any) {
    if (!c.metadata) c.metadata = {}
    const chapterFields = ['synopsis', 'characters', 'timeSetting', 'sceneSettings']
    for (const f of chapterFields) {
      if (!c.metadata[f]) c.metadata[f] = this.createDefaultMetadataItem()
    }
  }

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
      chapters: [],
    })

    await this.db.read()
    await this.db.write()
    console.log(' Database initialized')
  }

  // 文集管理
  async createCollection(data: {
    name: string
    description?: string
    tags?: string[]
  }): Promise<Collection> {
    await this.init()
    await this.db!.read()

    const collection: Collection = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      tags: data.tags || [],
      projectCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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

  // 生成带时间戳的ID
  private generateTimestampId(prefix: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d+Z$/, '')
      .slice(0, 14) // YYYYMMDDHHmmss
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`
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

    const now = new Date().toISOString()
    const project: Project & { metadata?: any; chapterPlanning?: any[] } = {
      id: this.generateTimestampId('proj'),
      title: data.title,
      description: data.description || '',
      author: data.author,
      genre: data.genre || [],
      tags: data.tags || [],
      status: (data.status as any) || 'draft',
      collectionId: data.collectionId || '',
      wordCount: 0,
      chapterCount: 0,
      createdAt: now,
      updatedAt: now,
      metadata: {
        synopsis: this.createDefaultMetadataItem(),
        characters: this.createDefaultMetadataItem(),
        timeline: this.createDefaultMetadataItem(),
        settings: this.createDefaultMetadataItem(),
        relationships: this.createDefaultMetadataItem(),
        plotStructure: this.createDefaultMetadataItem(),
      },
      chapterPlanning: [],
    }

    this.db!.data.projects.push(project as Project)

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

    const list = collectionId
      ? this.db!.data.projects.filter(p => p.collectionId === collectionId)
      : this.db!.data.projects

    // 确保元数据存在
    list.forEach(p => this.ensureProjectMetadata(p as any))
    return list
  }

  async getProjectById(id: string): Promise<Project | null> {
    await this.init()
    await this.db!.read()
    const p = this.db!.data.projects.find(p => p.id === id) as any
    if (!p) return null
    this.ensureProjectMetadata(p)
    return p as Project
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    await this.init()
    await this.db!.read()

    const project = this.db!.data.projects.find(p => p.id === id) as any
    if (!project) return null

    Object.assign(project, updates, {
      id,
      updatedAt: new Date().toISOString(),
    })

    this.ensureProjectMetadata(project)

    await this.db!.write()
    return project as Project
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

    const chapter: Chapter & { metadata?: any } = {
      id: this.generateTimestampId('chap'),
      title: data.title,
      content: data.content || '',
      projectId: data.projectId,
      order:
        data.order || this.db!.data.chapters.filter(c => c.projectId === data.projectId).length + 1,
      wordCount: data.content ? data.content.split(/\s+/).length : 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        synopsis: this.createDefaultMetadataItem(),
        characters: this.createDefaultMetadataItem(),
        timeSetting: this.createDefaultMetadataItem(),
        sceneSettings: this.createDefaultMetadataItem(),
      },
    }

    this.db!.data.chapters.push(chapter)

    // 更新项目统计
    project.chapterCount++
    project.wordCount = this.db!.data.chapters.filter(c => c.projectId === data.projectId).reduce(
      (sum, c) => sum + c.wordCount,
      0
    )

    await this.db!.write()
    return chapter
  }

  async getChapters(projectId: string): Promise<Chapter[]> {
    await this.init()
    await this.db!.read()
    const list = this.db!.data.chapters.filter(c => c.projectId === projectId).sort(
      (a, b) => a.order - b.order
    )
    list.forEach(c => this.ensureChapterMetadata(c as any))
    return list
  }

  async getChapterById(id: string): Promise<Chapter | null> {
    await this.init()
    await this.db!.read()
    const chapter = this.db!.data.chapters.find(c => c.id === id) || null
    if (chapter) this.ensureChapterMetadata(chapter as any)
    return chapter
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
    await this.init()
    await this.db!.read()

    const chapter = this.db!.data.chapters.find(c => c.id === id)
    if (!chapter) return null

    const oldWordCount = chapter.wordCount

    Object.assign(chapter, updates, {
      id,
      updatedAt: new Date().toISOString(),
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

    this.ensureChapterMetadata(chapter as any)
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
      results.collections = this.db!.data.collections.filter(
        c =>
          c.name.toLowerCase().includes(searchTerm) ||
          (c.description && c.description.toLowerCase().includes(searchTerm)) ||
          c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    if (!type || type === 'projects') {
      results.projects = this.db!.data.projects.filter(
        p =>
          p.title.toLowerCase().includes(searchTerm) ||
          (p.description && p.description.toLowerCase().includes(searchTerm)) ||
          p.author.toLowerCase().includes(searchTerm) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          p.genre.some(genre => genre.toLowerCase().includes(searchTerm))
      )
    }

    if (!type || type === 'chapters') {
      results.chapters = this.db!.data.chapters.filter(
        c =>
          c.title.toLowerCase().includes(searchTerm) || c.content.toLowerCase().includes(searchTerm)
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
      lastUpdated: new Date().toISOString(),
    }
  }

  // ===== 元数据字段白名单 =====
  private isAllowedField(field: string) {
    const projectFields = [
      'synopsis',
      'characters',
      'timeline',
      'settings',
      'relationships',
      'plotStructure',
    ]
    const chapterFields = ['synopsis', 'characters', 'timeSetting', 'sceneSettings']
    return [...projectFields, ...chapterFields].includes(field)
  }

  // ===== 章节规划（Project级结构化数据） =====
  async updateProjectChapterPlanning(projectId: string, plans: any[]) {
    await this.init()
    await this.db!.read()

    const project = this.db!.data.projects.find(p => p.id === projectId) as any
    if (!project) throw new Error('Project not found')

    if (!Array.isArray(plans)) throw new Error('Invalid chapter planning payload')
    project.chapterPlanning = plans
    project.updatedAt = new Date().toISOString()

    await this.db!.write()
    return project.chapterPlanning
  }

  async updateProjectMetadataField(projectId: string, field: string, content: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const project = this.db!.data.projects.find(p => p.id === projectId) as any
    if (!project) throw new Error('Project not found')

    this.ensureProjectMetadata(project)

    const now = new Date().toISOString()
    const item: MetadataItem = project.metadata[field] || this.createDefaultMetadataItem()
    item.current = content || ''
    item.wordCount = item.current ? item.current.trim().split(/\s+/).length : 0
    item.lastModified = now
    project.metadata[field] = item

    await this.db!.write()
    return item
  }

  async getProjectMetadataVersions(projectId: string, field: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const project = this.db!.data.projects.find(p => p.id === projectId) as any
    if (!project) throw new Error('Project not found')

    this.ensureProjectMetadata(project)
    const item: MetadataItem = project.metadata[field] || this.createDefaultMetadataItem()
    return item.versions
  }

  async getProjectMetadataField(projectId: string, field: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const project = this.db!.data.projects.find(p => p.id === projectId) as any
    if (!project) throw new Error('Project not found')

    this.ensureProjectMetadata(project)
    const item: MetadataItem = project.metadata[field] || this.createDefaultMetadataItem()
    return item
  }

  async saveProjectMetadataVersion(
    projectId: string,
    field: string,
    content: string,
    userNote = '',
    autoSaved = false
  ) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const project = this.db!.data.projects.find(p => p.id === projectId) as any
    if (!project) throw new Error('Project not found')

    this.ensureProjectMetadata(project)

    const now = new Date().toISOString()
    const version: SavedVersion = {
      id: uuidv4(),
      content: content || '',
      timestamp: now,
      userNote: userNote || '',
      autoSaved: !!autoSaved,
    }

    const item: MetadataItem = project.metadata[field] || this.createDefaultMetadataItem()
    item.versions.push(version)
    item.lastModified = now
    project.metadata[field] = item

    await this.db!.write()
    return version
  }

  // Chapter Metadata Methods
  async updateChapterMetadataField(chapterId: string, field: string, content: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)

    const now = new Date().toISOString()
    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    item.current = content || ''
    item.wordCount = item.current ? item.current.trim().split(/\s+/).length : 0
    item.lastModified = now
    chapter.metadata[field] = item

    await this.db!.write()
    return item
  }

  // ===== 章节元数据（Chapter级） =====
  async updateChapterMetadataField(chapterId: string, field: string, content: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)

    const now = new Date().toISOString()
    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    item.current = content || ''
    item.wordCount = item.current ? item.current.trim().split(/\s+/).length : 0
    item.lastModified = now
    chapter.metadata[field] = item

    await this.db!.write()
    return item
  }

  async getChapterMetadataField(chapterId: string, field: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)
    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    return item
  }

  async getChapterMetadataVersions(chapterId: string, field: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)
    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    return item.versions
  }

  async saveChapterMetadataVersion(
    chapterId: string,
    field: string,
    content: string,
    userNote = '',
    autoSaved = false
  ) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)

    const now = new Date().toISOString()
    const version: SavedVersion = {
      id: uuidv4(),
      content: content || '',
      timestamp: now,
      userNote: userNote || '',
      autoSaved: !!autoSaved,
    }

    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    item.versions.push(version)
    item.lastModified = now
    chapter.metadata[field] = item

    await this.db!.write()
    return version
  }

  async getChapterMetadataVersions(chapterId: string, field: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)
    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    return item.versions
  }

  async getChapterMetadataField(chapterId: string, field: string) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)
    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    return item
  }

  async saveChapterMetadataVersion(
    chapterId: string,
    field: string,
    content: string,
    userNote = '',
    autoSaved = false
  ) {
    await this.init()
    await this.db!.read()

    if (!this.isAllowedField(field)) {
      throw new Error('Unsupported metadata field')
    }

    const chapter = this.db!.data.chapters.find(c => c.id === chapterId) as any
    if (!chapter) throw new Error('Chapter not found')

    this.ensureChapterMetadata(chapter)

    const now = new Date().toISOString()
    const version: SavedVersion = {
      id: uuidv4(),
      content: content || '',
      timestamp: now,
      userNote: userNote || '',
      autoSaved: !!autoSaved,
    }

    const item: MetadataItem = chapter.metadata[field] || this.createDefaultMetadataItem()
    item.versions.push(version)
    item.lastModified = now
    chapter.metadata[field] = item

    await this.db!.write()
    return version
  }
}

export const db = new DatabaseService()
export default DatabaseService
