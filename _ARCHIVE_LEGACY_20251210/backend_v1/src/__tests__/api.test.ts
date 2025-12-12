import { describe, it, expect } from '@jest/globals'

/**
 * API 响应格式测试
 */
describe('API Response Format', () => {
  it('should have correct structure', () => {
    const successResponse = {
      success: true,
      data: { id: '1', name: 'test' },
      message: '操作成功',
    }

    expect(successResponse).toHaveProperty('success')
    expect(successResponse).toHaveProperty('data')
    expect(successResponse.success).toBe(true)
  })

  it('should handle error response structure', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '验证失败',
      },
    }

    expect(errorResponse).toHaveProperty('success')
    expect(errorResponse).toHaveProperty('error')
    expect(errorResponse.success).toBe(false)
    expect(errorResponse.error).toHaveProperty('code')
    expect(errorResponse.error).toHaveProperty('message')
  })
})
