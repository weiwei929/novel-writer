/**
 * Project Metadata Type Definitions
 * 
 * Defines the structure of project and chapter metadata
 */

export interface ProjectMetadata {
  // Core metadata fields
  synopsis?: string
  characters?: string
  worldBuilding?: string
  plotStructure?: string
  themes?: string
  writingStyle?: string
  timeline?: string
  relationships?: string
  author?: string
  
  // System fields (prefixed with _)
  _draft?: Partial<ProjectMetadata>
  _extractedAt?: string
  _metadataExtractionStatus?: 'pending' | 'completed' | 'failed'
  _lastModified?: Record<string, string>
}

export interface ChapterMetadata {
  // Core metadata fields
  synopsis?: string
  characters?: string
  plotPoints?: string
  emotionalTone?: string
  notes?: string
  
  // System fields
  _lastModified?: Record<string, string>
}
