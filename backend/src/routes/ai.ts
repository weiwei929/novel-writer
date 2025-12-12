import { FastifyInstance } from 'fastify';
import { aiService } from '../services/ai/AIService';

interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system', content: string }[];
}

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
    const { messages } = request.body;
    
    if (!messages || !Array.isArray(messages)) {
      return reply.code(400).send({ error: 'Invalid messages format' });
    }

    try {
      const response = await aiService.chat(messages);
      return { content: response };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'AI Service Error' });
    }
  });

  fastify.get('/status', async () => {
    return { status: 'available', provider: 'mock' };
  });
}
