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

  fastify.post<{ Body: { prompt: string } }>('/generate/outline', async (request, reply) => {
      const { prompt } = request.body;
      if (!prompt) return reply.code(400).send({ error: 'Prompt required' });
      
      try {
        const outline = await aiService.generateStructured(prompt, 'ProjectOutline');
        return { success: true, data: outline };
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Generation failed' });
      }
  });
}
