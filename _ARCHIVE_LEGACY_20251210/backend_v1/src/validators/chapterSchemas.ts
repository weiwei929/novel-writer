import Joi from 'joi'

/**
 * 章节相关验证 Schema
 */
export const chapterSchemas = {
  // 创建章节
  create: Joi.object({
    projectId: Joi.string().required().min(1).messages({
      'any.required': '项目ID是必填项',
      'string.min': '项目ID不能为空',
    }),
    title: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': '章节标题不能为空',
      'string.min': '章节标题至少需要1个字符',
      'string.max': '章节标题不能超过200个字符',
      'any.required': '章节标题是必填项',
    }),
    content: Joi.string().allow('').optional(),
    order: Joi.number().integer().min(1).optional(),
    notes: Joi.string().trim().max(5000).allow('').optional(),
    summary: Joi.string().trim().max(1000).allow('').optional(),
  }),

  // 更新章节
  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    content: Joi.string().optional(),
    order: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('draft', 'writing', 'completed', 'published').optional(),
    notes: Joi.string().trim().max(5000).allow('').optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
    summary: Joi.string().trim().max(1000).allow('').optional(),
  }),

  // ID 参数
  id: Joi.object({
    id: Joi.string().required().min(1),
  }),

  // 项目ID和章节ID
  projectAndChapter: Joi.object({
    id: Joi.string().required().min(1),
    chapterId: Joi.string().required().min(1),
  }),
}
