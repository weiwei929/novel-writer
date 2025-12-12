import { describe, it, expect } from '@jest/globals'

/**
 * 工具函数测试
 */
describe('Utility Functions', () => {
  describe('String utilities', () => {
    it('should trim strings correctly', () => {
      const str = '  test  '
      expect(str.trim()).toBe('test')
    })

    it('should handle empty strings', () => {
      expect(''.trim()).toBe('')
    })
  })

  describe('Array utilities', () => {
    it('should filter arrays correctly', () => {
      const arr = [1, 2, 3, 4, 5]
      const filtered = arr.filter(n => n > 3)
      expect(filtered).toEqual([4, 5])
    })
  })
})
