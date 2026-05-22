import * as fs from 'fs';
import * as path from 'path';

export interface AppSettings {
  ai: {
    provider: 'openai' | 'ollama' | 'deepseek' | 'gemini' | 'mock';
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: 'gemini', // Defaulting to Gemini as requested
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-3.5-flash',
    baseUrl: ''
  }
};

/** Non-empty file value wins; otherwise fall back to GEMINI_API_KEY from env. */
function resolveApiKey(stored?: string): string {
  const trimmed = stored?.trim();
  if (trimmed) return trimmed;
  return process.env.GEMINI_API_KEY?.trim() || '';
}

function withResolvedApiKey(settings: AppSettings): AppSettings {
  return {
    ...settings,
    ai: {
      ...settings.ai,
      apiKey: resolveApiKey(settings.ai.apiKey),
    },
  };
}

export class SettingsManager {
  private configPath: string;
  private settings: AppSettings;

  constructor() {
    this.configPath = path.join(process.cwd(), 'app-settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const merged: AppSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
        };
        return withResolvedApiKey(merged);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return withResolvedApiKey(DEFAULT_SETTINGS);
  }

  getSettings(): AppSettings {
    return withResolvedApiKey(this.settings);
  }

  updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    // Deep merge for ai config if needed, simplified here
    if (newSettings.ai) {
        this.settings.ai = { ...this.settings.ai, ...newSettings.ai };
    }
    this.saveSettings();
    return this.settings;
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}

export const settingsManager = new SettingsManager();
