// 应用设置管理
interface AppSettings {
  aiEnabled: boolean
  grokApiKey?: string
  theme: 'light' | 'dark'
  autoSave: boolean
  autoSaveInterval: number
  language: 'zh-CN' | 'en-US'
}

const DEFAULT_SETTINGS: AppSettings = {
  aiEnabled: false, // 默认关闭 AI 功能
  grokApiKey: '',
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 2000,
  language: 'zh-CN',
}

class SettingsManager {
  private settings: AppSettings

  constructor() {
    this.settings = this.loadSettings()
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem('novel-writer-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('novel-writer-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  get(key: keyof AppSettings): any {
    return this.settings[key]
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value
    this.saveSettings()

    // 触发设置更新事件
    window.dispatchEvent(
      new CustomEvent('settings-updated', {
        detail: { key, value },
      })
    )
  }

  getAll(): AppSettings {
    return { ...this.settings }
  }

  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS }
    this.saveSettings()
    window.dispatchEvent(
      new CustomEvent('settings-updated', {
        detail: { reset: true },
      })
    )
  }

  // AI 功能相关方法
  isAIEnabled(): boolean {
    return this.settings.aiEnabled
  }

  enableAI(apiKey?: string): void {
    this.settings.aiEnabled = true
    if (apiKey) {
      this.settings.grokApiKey = apiKey
    }
    this.saveSettings()
  }

  disableAI(): void {
    this.settings.aiEnabled = false
    this.saveSettings()
  }
}

export const settingsManager = new SettingsManager()
export type { AppSettings }
