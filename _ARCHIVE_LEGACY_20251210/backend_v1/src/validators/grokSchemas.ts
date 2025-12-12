import Joi from 'joi'

/**
 * Grok AI 相关验证 Schema
 */
export const grokSchemas = {
  // 生成内容
  generate: Joi.object({
    prompt: Joi.string().trim().min(1).max(10000).required().messages({
      'string.empty': '提示词不能为空',
      'string.min': '提示词至少需要1个字符',
      'string.max': '提示词不能超过10000个字符',
      'any.required': '提示词是必填项',
    }),
    context: Joi.string().trim().max(50000).allow('').optional(),
    maxTokens: Joi.number().integer().min(1).max(100000).optional(),
    temperature: Joi.number().min(0).max(2).default(0.7),
    systemPrompt: Joi.string().trim().max(5000).allow('').optional(),
  }),

  // 流式生成（与 generate 相同）
  generateStream: Joi.object({
    prompt: Joi.string().trim().min(1).max(10000).required(),
    context: Joi.string().trim().max(50000).allow('').optional(),
    maxTokens: Joi.number().integer().min(1).max(100000).optional(),
    temperature: Joi.number().min(0).max(2).default(0.7),
    systemPrompt: Joi.string().trim().max(5000).allow('').optional(),
  }),

  // 写作建议
  writingSuggestion: Joi.object({
    content: Joi.string().trim().min(1).max(100000).required().messages({
      'string.empty': '内容不能为空',
      'string.min': '内容至少需要1个字符',
      'string.max': '内容不能超过100000个字符',
      'any.required': '内容是必填项',
    }),
    type: Joi.string().valid('continue', 'improve', 'brainstorm').default('continue').messages({
      'any.only': '类型必须是 continue、improve 或 brainstorm 之一',
    }),
  }),

  // 生成角色
  generateCharacter: Joi.object({
    description: Joi.string().trim().min(1).max(5000).required().messages({
      'string.empty': '角色描述不能为空',
      'string.min': '角色描述至少需要1个字符',
      'string.max': '角色描述不能超过5000个字符',
      'any.required': '角色描述是必填项',
    }),
  }),

  // 生成世界观
  generateWorld: Joi.object({
    theme: Joi.string().trim().min(1).max(2000).required().messages({
      'string.empty': '主题不能为空',
      'string.min': '主题至少需要1个字符',
      'string.max': '主题不能超过2000个字符',
      'any.required': '主题是必填项',
    }),
  }),

  // 生成对话
  generateDialogue: Joi.object({
    characters: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().trim().min(1).max(100).required(),
          personality: Joi.string().trim().max(1000).allow('').optional(),
        })
      )
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': '至少需要1个角色',
        'array.max': '最多支持10个角色',
        'any.required': '角色列表是必填项',
      }),
    context: Joi.string().trim().min(1).max(5000).required().messages({
      'string.empty': '对话上下文不能为空',
      'string.min': '对话上下文至少需要1个字符',
      'string.max': '对话上下文不能超过5000个字符',
      'any.required': '对话上下文是必填项',
    }),
  }),
}
