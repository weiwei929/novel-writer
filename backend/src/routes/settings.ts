import { FastifyInstance } from 'fastify'
import { settingsManager } from '../services/SettingsManager'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  ai: z.object({
    provider: z.enum(['openai', 'ollama', 'deepseek', 'gemini', 'mock']),
    apiKey: z.string().optional(),
    model: z.string().optional(),
    baseUrl: z.string().optional(),
  }).optional()
})

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get Settings
  fastify.get('/', async (request, reply) => {
    const settings = settingsManager.getSettings();
    // Mask API Key for security when sending to frontend
    const maskedSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            apiKey: settings.ai.apiKey ? '******' + settings.ai.apiKey.slice(-4) : '',
            hasKey: !!settings.ai.apiKey
        }
    };
    return { success: true, data: maskedSettings };
  })

  // Update Settings
  fastify.put('/', async (request, reply) => {
    try {
      const body = updateSettingsSchema.parse(request.body);
      
      // If key is '******', keep existing key
      let newAiConfig = body.ai;
      if (newAiConfig && newAiConfig.apiKey && newAiConfig.apiKey.startsWith('******')) {
          const current = settingsManager.getSettings();
          newAiConfig.apiKey = current.ai.apiKey;
      }

      const updated = settingsManager.updateSettings({
          ai: newAiConfig as any
      });
      
      return { success: true, settings: updated }
    } catch (error) {
      reply.status(400)
      return { error: 'Invalid settings format', details: error }
    }
  })
}
