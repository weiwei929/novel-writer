import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ApiErrorCode, createErrorResponse, ErrorCodeToHttpStatus } from '../types/api.js'
import { log } from '../utils/logger.js'

/**
 * Joi 验证中间件工厂
 * @param schema Joi schema 对象
 * @param source 验证来源：'body' | 'query' | 'params'
 */
export const validate = (
  schema: Joi.ObjectSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params

    const { error, value } = schema.validate(data, {
      abortEarly: false, // 返回所有错误
      stripUnknown: true, // 移除未知字段
    })

    if (error) {
      const errors = error.details.map(detail => detail.message).join(', ')
      log.warn('Validation failed', {
        source,
        errors,
        path: req.path,
        method: req.method,
      })

      const response = createErrorResponse(ApiErrorCode.VALIDATION_ERROR, `验证失败: ${errors}`, {
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })

      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR]).json(response)
    }

    // 将验证后的值写回请求对象
    if (source === 'body') {
      req.body = value
    } else if (source === 'query') {
      req.query = value as Request['query']
    } else {
      req.params = value as Request['params']
    }

    next()
  }
}

/**
 * 常用验证 Schema
 */
export const commonSchemas = {
  // ID 验证
  id: Joi.string().required().min(1),

  // 分页参数
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // 搜索查询
  search: Joi.object({
    q: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('collections', 'projects', 'chapters').optional(),
  }),
}
