import { resolveAppPassword } from '../auth'

describe('resolveAppPassword', () => {
  it('uses APP_PASSWORD when set', () => {
    expect(resolveAppPassword({ APP_PASSWORD: 'secret', NODE_ENV: 'production' })).toBe('secret')
  })

  it('allows development default when APP_PASSWORD is unset', () => {
    expect(resolveAppPassword({ NODE_ENV: 'development' })).toBe('novel2024')
  })

  it('allows development default when NODE_ENV is test', () => {
    expect(resolveAppPassword({ NODE_ENV: 'test' })).toBe('novel2024')
  })

  it('throws in production when APP_PASSWORD is unset', () => {
    expect(() => resolveAppPassword({ NODE_ENV: 'production' })).toThrow(
      /APP_PASSWORD is required when NODE_ENV=production/
    )
  })

  it('throws in production when APP_PASSWORD is blank', () => {
    expect(() => resolveAppPassword({ APP_PASSWORD: '   ', NODE_ENV: 'production' })).toThrow(
      /APP_PASSWORD is required when NODE_ENV=production/
    )
  })
})
