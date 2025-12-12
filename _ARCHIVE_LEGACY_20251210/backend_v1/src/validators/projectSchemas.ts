import Joi from 'joi'

/**
 * 项目相关验证 Schema
 */
export const projectSchemas = {
  // 创建项目
  create: Joi.object({
    title: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': '项目标题不能为空',
      'string.min': '项目标题至少需要1个字符',
      'string.max': '项目标题不能超过200个字符',
      'any.required': '项目标题是必填项',
    }),
    description: Joi.string().trim().max(2000).allow('').optional(),
    author: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': '作者名称不能为空',
      'string.min': '作者名称至少需要1个字符',
      'string.max': '作者名称不能超过100个字符',
      'any.required': '作者名称是必填项',
    }),
    genre: Joi.array().items(Joi.string().trim().max(50)).default([]),
    tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
    status: Joi.string()
      .valid('draft', 'writing', 'completed', 'published', 'archived')
      .default('draft'),
    collectionId: Joi.string().allow(null, '').optional(),
  }),

  // 更新项目
  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(2000).allow('').optional(),
    author: Joi.string().trim().min(1).max(100).optional(),
    genre: Joi.array().items(Joi.string().trim().max(50)).optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
    status: Joi.string().valid('draft', 'writing', 'completed', 'published', 'archived').optional(),
    collectionId: Joi.string().allow(null, '').optional(),
  }),

  // ID 参数
  id: Joi.object({
    id: Joi.string().required().min(1),
  }),
}
