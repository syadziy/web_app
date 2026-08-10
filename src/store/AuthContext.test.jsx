import { describe, expect, it } from 'vitest'
import { normalizeSession } from './session'

describe('normalizeSession', () => {
  it('unwraps the standard API response', () => {
    const session = { accessToken: 'token', tenantId: 'tenant-id' }

    expect(normalizeSession({ code: 'RC-200', data: session })).toBe(session)
  })

  it('keeps an unwrapped session for compatibility', () => {
    const session = { accessToken: 'token', tenantId: 'tenant-id' }

    expect(normalizeSession(session)).toBe(session)
  })
})
