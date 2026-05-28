import { FastifyInstance } from 'fastify';
import { aiService } from '../services/ai/AIService';

import { promptManager } from '../services/ai/PromptManager';
import { contextManager } from '../services/ai/ContextManager';

interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system', content: string }[];
  projectId?: string;
  chapterId?: string;
  contextType?: 'chat' | 'writing' | 'global' | 'chapter_review';
  writingType?: 'continue' | 'improve' | 'brainstorm';
  currentContent?: string;
}

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
    const { messages, projectId, chapterId, contextType, writingType, currentContent } = request.body;
    
    if (!messages || !Array.isArray(messages)) {
      return reply.code(400).send({ error: 'Invalid messages format' });
    }

    let systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    
    // Inject Context-aware System Prompt
    try {
        let contextPrompt = '';
        
        // 1. Global Review Mode (Tier C)
        if (contextType === 'global' && projectId) {
             // Tier C: Global Review Context (Returns full system prompt)
             const prompt = await promptManager.getReviewSystemPrompt(projectId);
             systemPrompt = `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}`;
        }
        // 2. Chapter Review Mode (Tier B - Review)
        else if (contextType === 'chapter_review' && chapterId && currentContent) {
             const prompt = await promptManager.getChapterReviewSystemPrompt(chapterId, currentContent);
             systemPrompt = `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}`;
        }
        // 3. Writing Mode (Specific Task via Legacy Assistant or New Panel Actions)
        else if (writingType && chapterId && currentContent) {
             const prompt = await promptManager.getWritingSystemPrompt(chapterId, currentContent, writingType as any);
             // PromptManager returns full system prompt (Role + Context)
             systemPrompt = `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}`;
        } 
        // 3. Chat Mode (General Conversation)
        else {
            if (chapterId) {
                 // Tier B: Chapter Context
                 contextPrompt = await contextManager.buildChapterContext(chapterId, currentContent || '');
            } else if (projectId) {
                 // Tier A: Project Context
                 contextPrompt = await contextManager.buildProjectContext(projectId);
            }

            if (contextPrompt) {
                 systemPrompt = `${systemPrompt ? systemPrompt + '\n\n' : ''}IMPORTANT CONTEXT:\n${contextPrompt}`;
            }
        }
        
    } catch (e: any) {
        request.log.error(e, 'Context injection failed');
        // Fallback: proceed without enhanced context
    }

    // Reassemble messages with new system prompt
    const newMessages = messages.filter(m => m.role !== 'system');
    if (systemPrompt) {
        newMessages.unshift({ role: 'system', content: systemPrompt });
    }

    try {
      const response = await aiService.chat(newMessages);
      return { success: true, data: { content: response } };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'AI Service Error' });
    }
  });

  // 2. Generate Review
  fastify.post<{ Body: { content: string } }>('/generate/review', async (request, reply) => {
    const { content } = request.body;
    try {
      const report = await aiService.generateStructured(content, 'ReviewReport');
      return { success: true, data: report };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  // 3. Status
  fastify.get('/status', async (request, reply) => {
    return { status: 'available', provider: 'mock' };
  });

  // 4. Test Connection
  fastify.post('/test-connection', async (request, reply) => {
    try {
      // Send a simple test message to verify API connectivity
      const testMessages = [
        { role: 'user' as const, content: 'Hello' }
      ];
      
      const response = await aiService.chat(testMessages);
      
      // If we get here, the connection is successful
      const config = (await import('../services/SettingsManager')).settingsManager.getSettings().ai;
      
      return { 
        success: true, 
        data: {
          message: '连接成功',
          provider: config.provider,
          model: config.model
        }
      };
    } catch (error: any) {
      request.log.error(error, 'API connection test failed');
      return reply.code(500).send({ 
        success: false, 
        error: {
          code: 'CONNECTION_FAILED',
          message: error.message || 'API 连接失败',
          details: error.toString()
        }
      });
    }
  });

  // ===== AI 元数据助手 (NEW) =====
  
  // 5. AI 元数据对话式构建
  fastify.post<{ 
    Body: { 
      type: 'project' | 'chapter';
      entityId: string;
      field: string;
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      userMessage: string;
    } 
  }>('/metadata/chat', async (request, reply) => {
    const { type, entityId, field, conversationHistory, userMessage } = request.body;
    
    if (!type || !entityId || !field || !userMessage) {
      return reply.code(400).send({ error: 'Missing required parameters' });
    }

    try {
      // 构建系统 Prompt
      const systemPrompt = await promptManager.getMetadataGuidedPrompt(type, entityId, field);
      
      // 组装消息
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];

      const response = await aiService.chat(messages);
      
      return { success: true, data: { content: response } };
    } catch (error: any) {
      request.log.error(error, 'Metadata chat failed');
      return reply.code(500).send({ error: error.message || 'Metadata chat failed' });
    }
  });

  // 6. AI 元数据提取（从已有内容）
  fastify.post<{ 
    Body: { 
      type: 'project' | 'chapter';
      entityId: string;
      content: string;
    } 
  }>('/metadata/extract', async (request, reply) => {
    const { type, entityId, content } = request.body;
    
    if (!type || !entityId || !content) {
      return reply.code(400).send({ error: 'Missing required parameters' });
    }

    try {
      // 构建提取 Prompt
      const systemPrompt = await promptManager.getMetadataExtractPrompt(type, content);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: '请提取元数据' }
      ];

      const response = await aiService.chat(messages);
      
      return { success: true, data: { extractedMetadata: response } };
    } catch (error: any) {
      request.log.error(error, 'Metadata extraction failed');
      return reply.code(500).send({ error: error.message || 'Metadata extraction failed' });
    }
  });

  // ===== AI 章节大纲生成 (NEW) =====
  
  // 7. AI 章节大纲生成（一次性生成所有章节）
  fastify.post<{ 
    Body: { 
      projectId: string;
      chapterCount?: number;
      userRequirements?: string;
    } 
  }>('/chapters/generate-outline', async (request, reply) => {
    const { projectId, chapterCount = 20, userRequirements } = request.body;
    
    if (!projectId) {
      return reply.code(400).send({ error: 'Missing projectId' });
    }

    try {
      // 构建系统 Prompt
      const systemPrompt = await promptManager.getChapterOutlinePrompt(projectId, chapterCount, userRequirements);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: '请生成章节大纲' }
      ];

      const response = await aiService.chat(messages);
      
      // 尝试解析 JSON
      let outline;
      try {
        // 提取 JSON（可能在代码块中）
        const jsonMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
        outline = JSON.parse(jsonStr);
      } catch (parseError) {
        request.log.error(parseError, 'Failed to parse outline JSON');
        return reply.code(500).send({ error: 'AI 返回的格式无法解析，请重试' });
      }
      
      return { success: true, data: { outline } };
    } catch (error: any) {
      request.log.error(error, 'Chapter outline generation failed');
      return reply.code(500).send({ error: error.message || 'Chapter outline generation failed' });
    }
  });

  // ===== 原有功能保留 =====

  // 8. Global Review (Tier C Context)
  fastify.post<{ Body: { projectId: string } }>('/review/global', async (request, reply) => {
    const { projectId } = request.body;
    
    if (!projectId) {
      return reply.code(400).send({ error: 'projectId is required' });
    }

    try {
      const systemPrompt = await promptManager.getReviewSystemPrompt(projectId);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: '请基于以上章节摘要,进行全书体检。' }
      ];

      const response = await aiService.chat(messages);
      
      return { success: true, data: { report: response } };
    } catch (error: any) {
      request.log.error(error, 'Global review failed');
      return reply.code(500).send({ error: error.message || 'Global review failed' });
    }
  });

  // 8. Chapter Review (Tier B Context)
  fastify.post<{ Body: { chapterId: string; content: string } }>('/review/chapter', async (request, reply) => {
    const { chapterId, content } = request.body;
    
    if (!chapterId || !content) {
      return reply.code(400).send({ error: 'chapterId and content are required' });
    }

    try {
      const systemPrompt = await promptManager.getChapterReviewSystemPrompt(chapterId, content);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: '请审阅当前章节。' }
      ];

      const response = await aiService.chat(messages);
      
      return { success: true, data: { report: response } };
    } catch (error: any) {
      request.log.error(error, 'Chapter review failed');
      return reply.code(500).send({ error: error.message || 'Chapter review failed' });
    }
  });
}
