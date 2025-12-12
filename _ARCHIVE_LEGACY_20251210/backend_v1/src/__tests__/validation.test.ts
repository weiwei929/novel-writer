import { describe, it, expect } from '@jest/globals'
import Joi from 'joi'
import { collectionSchemas } from '../validators/collectionSchemas.js'

/**
 * 验证 Schema 测试
 */
describe('Validation Schemas', () => {
  describe('Collection Schemas', () => {
    it('should validate collection creation data', () => {
      const validData = {
        name: 'Test Collection',
        description: 'Test description',
      }

      const { error } = collectionSchemas.create.validate(validData)
      expect(error).toBeUndefined()
    })

    it('should reject invalid collection data', () => {
      const invalidData = {
        name: '', // 空名称应该被拒绝
      }

      const { error } = collectionSchemas.create.validate(invalidData)
      expect(error).toBeDefined()
    })

    it('should validate collection ID', () => {
      const validId = { id: '123' }
      const { error } = collectionSchemas.id.validate(validId)
      expect(error).toBeUndefined()
    })
  })
})
