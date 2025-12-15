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

  async chat(messages: AIChatMessage[]): Promise<string> {
    const config = this.getConfig();
    logDebug('chat called', { provider: config.provider, messageCount: messages.length });

    if (config.provider === 'mock') {
      return this.mockChat(messages);
    }
    
    if (config.provider === 'gemini' && this.model) {
      try {
        const systemMsg = messages.find(m => m.role === 'system')?.content;
        let conversation = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        // Gemini requires history to start with 'user'
        // If the first message is 'model', remove it (often the "Hi I'm AI" greeting)
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

    return "Provider not implemented or configured";
  }

  async generateStructured<T>(prompt: string, schemaDescription: string): Promise<T> {
    const config = this.getConfig();

    if (config.provider === 'mock') {
       if (schemaDescription.includes('ProjectOutline')) return this.mockOutlineGen(prompt) as unknown as T;
       if (schemaDescription.includes('ReviewReport')) return this.mockReview(prompt) as unknown as T;
    }
    
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

    throw new Error('Provider not supported or schema unknown');
  }

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

  private mockReview(content: string): any {
     return { overallScore: 7.5, issues: [] };
  }
}

export const aiService = new AIService();

