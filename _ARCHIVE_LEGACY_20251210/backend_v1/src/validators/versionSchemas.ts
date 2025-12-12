import Joi from 'joi'
import { VersionType, VersionStatus } from '../types/version.js'

/**
 * 版本相关验证 Schema
 */
export const versionSchemas = {
  // 项目ID参数
  projectId: Joi.object({
    projectId: Joi.string().required().min(1),
  }),

  // 版本ID参数
  versionId: Joi.object({
    versionId: Joi.string().required().min(1),
  }),

  // 项目和版本ID
  projectAndVersionId: Joi.object({
    projectId: Joi.string().required().min(1),
    versionId: Joi.string().required().min(1),
  }),

  // 创建版本
  create: Joi.object({
    type: Joi.string()
      .valid(...Object.values(VersionType))
      .required()
      .messages({
        'any.only': '版本类型必须是 auto、manual、milestone 或 snapshot 之一',
        'any.required': '版本类型是必填项',
      }),
    title: Joi.string().trim().max(200).optional(),
    description: Joi.string().trim().max(2000).allow('').optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
  }),

  // 更新版本
  update: Joi.object({
    title: Joi.string().trim().max(200).optional(),
    description: Joi.string().trim().max(2000).allow('').optional(),
    status: Joi.string()
      .valid(...Object.values(VersionStatus))
      .optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
  }),

  // 恢复版本
  restore: Joi.object({
    createBackup: Joi.boolean().default(true),
    backupTitle: Joi.string().trim().max(200).optional(),
    backupDescription: Joi.string().trim().max(2000).allow('').optional(),
  }),

  // 版本列表查询
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string()
      .valid(...Object.values(VersionType))
      .optional(),
    status: Joi.string()
      .valid(...Object.values(VersionStatus))
      .optional(),
    tags: Joi.string().optional(), // 逗号分隔的标签
    search: Joi.string().trim().max(200).optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'versionNumber').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // 清理版本
  cleanup: Joi.object({
    keepCount: Joi.number().integer().min(1).max(1000).default(50),
  }),

  // 版本比较
  compare: Joi.object({
    sourceVersionId: Joi.string().required().min(1),
    targetVersionId: Joi.string().required().min(1),
  }),
}
