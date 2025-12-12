import axios from 'axios';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIServiceConfig {
  provider: 'openai' | 'ollama' | 'deepseek' | 'mock';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async chat(messages: AIChatMessage[]): Promise<string> {
    if (this.config.provider === 'mock') {
      return this.mockChat(messages);
    }
    // TODO: Implement other providers
    return this.mockChat(messages);
  }

  private async mockChat(messages: AIChatMessage[]): Promise<string> {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Simple echo logic for testing
    if (lastUserMsg.includes('续写')) {
      return `(Mock AI): 好的，我来尝试续写一段...\n\n随着引擎的轰鸣声逐渐平息，飞船进入了静默巡航模式。窗外的星河依旧璀璨，但一种难以言喻的孤独感开始在船舱内蔓延。`;
    }
    
    return `(Mock AI): 我收到了你的消息："${lastUserMsg}"。目前我处于测试模式，等待接入真实 API。`;
  }
}

// Singleton instance with default mock config
export const aiService = new AIService({
  provider: 'mock',
  model: 'gpt-3.5-turbo'
});
