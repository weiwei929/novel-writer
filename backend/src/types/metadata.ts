// 元数据与版本管理类型定义

export interface SavedVersion {
  id: string
  content: string
  timestamp: string
  userNote: string
  autoSaved: boolean
}

export interface MetadataItem {
  current: string
  versions: SavedVersion[]
  lastModified: string
  wordCount: number
}

export interface ChapterPlan {
  id: string
  order: number
  title: string
  plannedLength: number
  keyPlotPoints: string[]
  status: 'planned' | 'started' | 'completed'
}

export interface ProjectMetadata {
  synopsis: MetadataItem
  characters: MetadataItem
  timeline: MetadataItem
  settings: MetadataItem
  relationships: MetadataItem
  plotStructure: MetadataItem
}

export interface ChapterMetadata {
  synopsis: MetadataItem
  characters: MetadataItem
  timeSetting: MetadataItem
  sceneSettings: MetadataItem
}
