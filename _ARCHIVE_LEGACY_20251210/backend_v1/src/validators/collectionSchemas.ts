import Joi from 'joi'

/**
 * 文集相关验证 Schema
 */
export const collectionSchemas = {
  // 创建文集
  create: Joi.object({
    name: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': '文集名称不能为空',
      'string.min': '文集名称至少需要1个字符',
      'string.max': '文集名称不能超过200个字符',
      'any.required': '文集名称是必填项',
    }),
    description: Joi.string().trim().max(1000).allow('').optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
    isPublic: Joi.boolean().default(false),
  }),

  // 更新文集
  update: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).allow('').optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
    isPublic: Joi.boolean().optional(),
  }),

  // ID 参数
  id: Joi.object({
    id: Joi.string().required().min(1),
  }),
}
