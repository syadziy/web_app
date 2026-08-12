import { afterEach, describe, expect, it, vi } from 'vitest'
import { request } from './http'

describe('HTTP cookie authentication', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('includes HttpOnly authentication cookies without creating an Authorization header', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: { userId: 'user-1' } }),
    })
    vi.stubGlobal('fetch', fetch)

    await request('/api/v1/auth/session')

    expect(fetch).toHaveBeenCalledWith('http://localhost:9001/api/v1/auth/session',
      expect.objectContaining({ credentials: 'include' }))
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })
})
