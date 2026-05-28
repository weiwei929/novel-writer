import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

function logDebug(message: string, data?: any) {
  const logPath = path.join(process.cwd(), 'debug.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  fs.appendFileSync(logPath, logEntry);
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIServiceConfig {
  provider: 'openai' | 'ollama' | 'deepseek' | 'mock' | 'gemini';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

const SCHEMAS: Record<string, string> = {
  'ReviewReport': `
  {
    "overallScore": number (1-10),
    "overallComment": string,
    "issues": [
      {
        "id": string,
        "type": "typo" | "logic" | "style",
        "severity": "low" | "medium" | "high",
        "originalText": string,
        "suggestion": string,
        "explanation": string,
        "position": { "startLine": number, "endLine": number }
      }
    ]
  }`,
  'ProjectOutline': `
  {
    "premise": string,
    "acts": [
      {
        "title": string,
        "chapters": [
          { "title": string, "beats": string[] }
        ]
      }
    ]
  }`
};

/** OpenAI-compatible 提供商的默认 Base URL */
const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com',
  deepseek: 'https://api.deepseek.com',
  ollama: 'http://localhost:11434',
};

import { settingsManager } from '../SettingsManager';

export class AIService {
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private currentConfigSignature: string = '';

  constructor() {
      this.refreshConfig();
  }

  private refreshConfig() {
      const config = settingsManager.getSettings().ai;
      const signature = `${config.provider}-${config.apiKey}-${config.model}`;
      
      // Only re-init if config changed
      if (signature !== this.currentConfigSignature) {
          logDebug('Switching AI Config', { provider: config.provider, model: config.model });
          this.currentConfigSignature = signature;
          
          if (config.provider === 'gemini' && config.apiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(config.apiKey);
                this.model = this.genAI.getGenerativeModel({ 
                    model: config.model || "gemini-1.5-pro"
                });
            } catch (e) {
                console.error("Failed to init Gemini", e);
            }
          }
      }
  }

  private getConfig() {
      this.refreshConfig(); // Ensure we have latest
      return settingsManager.getSettings().ai;
  }

  /** 判断是否为 OpenAI-compatible 提供商 */
  private isOpenAICompat(provider: string): boolean {
    return ['openai', 'deepseek', 'ollama'].includes(provider);
  }

  // ========== OpenAI-compatible Chat ==========

  private async openaiCompatChat(messages: AIChatMessage[]): Promise<string> {
    const config = this.getConfig();
    const baseUrl = config.baseUrl || DEFAULT_BASE_URLS[config.provider] || '';
    const model = config.model || 'gpt-3.5-turbo';

    logDebug('openaiCompatChat', { provider: config.provider, baseUrl, model });

    const res = await axios.post(
      `${baseUrl}/v1/chat/completions`,
      {
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 60000,
      }
    );

    return res.data.choices?.[0]?.message?.content || '';
  }

  private async openaiCompatStructured(prompt: string, schemaDescription: string): Promise<string> {
    const config = this.getConfig();
    const baseUrl = config.baseUrl || DEFAULT_BASE_URLS[config.provider] || '';
    const model = config.model || 'gpt-3.5-turbo';
    const schemaDef = SCHEMAS[schemaDescription] || schemaDescription;

    const res = await axios.post(
      `${baseUrl}/v1/chat/completions`,
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are a specialized AI designed to output strictly valid JSON.

Output Schema:
${schemaDef}

Ensure the response is a valid JSON object matching this schema. Do not include markdown formatting.`
          },
          { role: 'user', content: `User Request: ${prompt}` }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 60000,
      }
    );

    const text = res.data.choices?.[0]?.message?.content || '';
    const cleanText = text.replace(/```json\n|\n```/g, '').trim();
    return cleanText;
  }

  // ========== Chat ==========

  async chat(messages: AIChatMessage[]): Promise<string> {
    const config = this.getConfig();
    logDebug('chat called', { provider: config.provider, messageCount: messages.length });

    if (config.provider === 'mock') {
      return this.mockChat(messages);
    }
    
    // Gemini
    if (config.provider === 'gemini' && this.model) {
      try {
        const systemMsg = messages.find(m => m.role === 'system')?.content;
        let conversation = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        if (conversation.length > 0 && conversation[0].role === 'model') {
            conversation = conversation.slice(1);
        }

        const chat = this.model.startChat({
            history: conversation.slice(0, -1),
            systemInstruction: systemMsg ? { role: "system", parts: [{ text: systemMsg }] } : undefined
        });

        const lastMsg = conversation[conversation.length - 1];
        const result = await chat.sendMessage(lastMsg.parts[0].text);
        const response = await result.response;
        return response.text();
      } catch (e: any) {
        console.error("Gemini Chat Error", e);
        return `Error: ${e.message}`;
      }
    }

    // OpenAI-compatible (openai / deepseek / ollama)
    if (this.isOpenAICompat(config.provider) && config.apiKey) {
      try {
        return await this.openaiCompatChat(messages);
      } catch (e: any) {
        console.error(`${config.provider} Chat Error`, e);
        const detail = e.response?.data?.error?.message || e.message;
        return `Error: ${detail}`;
      }
    }

    return "Provider not implemented or configured";
  }

  // ========== Structured Generation ==========

  async generateStructured<T>(prompt: string, schemaDescription: string): Promise<T> {
    const config = this.getConfig();

    if (config.provider === 'mock') {
       if (schemaDescription.includes('ProjectOutline')) return this.mockOutlineGen(prompt) as unknown as T;
       if (schemaDescription.includes('ReviewReport')) return this.mockReview(prompt) as unknown as T;
    }
    
    // Gemini
    if (config.provider === 'gemini' && this.model) {
       try {
         const jsonModel = this.genAI!.getGenerativeModel({
            model: config.model || "gemini-1.5-pro",
            generationConfig: { responseMimeType: "application/json" }
         });

         const schemaDef = SCHEMAS[schemaDescription] || schemaDescription;
         const systemPrompt = `You are a specialized AI designed to output strictly valid JSON.
         
         Output Schema:
         ${schemaDef}
         
         Ensure the response is a valid JSON object matching this schema. Do not include markdown formatting.
         `;

         const result = await jsonModel.generateContent([
            systemPrompt,
            `User Request: ${prompt}`
         ]);
         
         const text = result.response.text();
         const cleanText = text.replace(/```json\n|\n```/g, '').trim();
         return JSON.parse(cleanText) as T;

       } catch (e: any) {
         logDebug("Gemini Structured Error", { message: e.message, stack: e.stack });
         console.error("Gemini Structured Error", e);
         throw e;
       }
    }

    // OpenAI-compatible (openai / deepseek / ollama)
    if (this.isOpenAICompat(config.provider) && config.apiKey) {
      try {
        const jsonStr = await this.openaiCompatStructured(prompt, schemaDescription);
        return JSON.parse(jsonStr) as T;
      } catch (e: any) {
        logDebug(`${config.provider} Structured Error`, { message: e.message });
        console.error(`${config.provider} Structured Error`, e);
        throw e;
      }
    }

    throw new Error('Provider not supported or schema unknown');
  }

  // ========== Mock ==========

  private async mockChat(messages: AIChatMessage[]): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    if (systemMsg.includes('co-writer')) return `(Mock Continue): ...${userMsg.slice(-10)} 突然，一阵急促的敲门声打破了宁静...`;
    if (systemMsg.includes('editor')) return `(Mock Improve): \n建议修改如下...`;
    if (systemMsg.includes('creative muse')) return `(Mock Brainstorm):\n根据当前情节，我有以下 3 个点子...`;
    return `(Mock AI): 我收到了你的消息："${userMsg.substring(0, 20)}..."。目前我处于测试模式。`;
  }

  private mockOutlineGen(prompt: string): any {
     return { premise: prompt, acts: [] };
  }

  private mockReview(_content: string): any {
     return { overallScore: 7.5, issues: [] };
  }
}

export const aiService = new AIService();
