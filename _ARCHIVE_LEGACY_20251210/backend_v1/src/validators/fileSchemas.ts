import Joi from 'joi'

/**
 * 文件相关验证 Schema
 */
export const fileSchemas = {
  // 导入文件
  import: Joi.object({
    collectionId: Joi.string().optional(),
    createNewCollection: Joi.boolean().default(false),
    mergeStrategy: Joi.string().valid('replace', 'merge', 'skip').default('merge'),
  }),

  // 导出文件
  export: Joi.object({
    collectionId: Joi.string().required().min(1).messages({
      'string.empty': '文集ID不能为空',
      'any.required': '文集ID是必填项',
    }),
    format: Joi.string().valid('docx', 'txt', 'md', 'json', 'zip').default('docx').messages({
      'any.only': '导出格式必须是 docx、txt、md、json 或 zip 之一',
    }),
    includeMetadata: Joi.boolean().default(true),
    includeChapters: Joi.boolean().default(true),
    includeProjects: Joi.boolean().default(true),
  }),

  // 批量导出
  batchExport: Joi.object({
    collectionIds: Joi.array().items(Joi.string().min(1)).min(1).max(50).required().messages({
      'array.min': '至少需要选择一个文集',
      'array.max': '最多支持50个文集',
      'any.required': '文集ID列表是必填项',
    }),
    format: Joi.string().valid('docx', 'txt', 'md', 'json', 'zip').default('zip').messages({
      'any.only': '导出格式必须是 docx、txt、md、json 或 zip 之一',
    }),
    includeMetadata: Joi.boolean().default(true),
  }),
}
