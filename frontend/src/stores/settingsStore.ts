import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AISettings {
  partner: boolean
  writer: boolean
  reviewer: boolean
  auditor: boolean
}

export type EditorTheme = 'novel-light' | 'novel-dark' | 'novel-sepia'
export type EditorFontSize = 14 | 16 | 18 | 20
export type AutoSaveDelay = 1000 | 2000 | 3000 | 5000

export interface EditorSettings {
  theme: EditorTheme
  fontSize: EditorFontSize
  autoSave: boolean
  autoSaveDelay: AutoSaveDelay
  referenceSidebar: boolean
}

interface SettingsState {
  ai: AISettings
  editor: EditorSettings
  setAISettings: (settings: Partial<AISettings>) => void
  setEditorSettings: (settings: Partial<EditorSettings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      ai: { partner: true, writer: true, reviewer: false, auditor: true },
      editor: {
        theme: 'novel-light',
        fontSize: 16,
        autoSave: true,
        autoSaveDelay: 2000,
        referenceSidebar: true,
      },
      setAISettings: settings =>
        set(state => ({ ai: { ...state.ai, ...settings } })),
      setEditorSettings: settings =>
        set(state => ({ editor: { ...state.editor, ...settings } })),
    }),
    { name: 'novel-settings' }
  )
)
