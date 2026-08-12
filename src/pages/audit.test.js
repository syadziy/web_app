import { describe, expect, it } from 'vitest'
import { endpointFrom } from './audit'

describe('audit endpoint display', () => {
  it('distinguishes alert endpoints with the same action', () => {
    expect(endpointFrom({ metadata: { httpMethod: 'GET', httpPath: '/api/v1/alert/recipients' } }))
      .toBe('GET /api/v1/alert/recipients')
    expect(endpointFrom({ metadata: { httpMethod: 'GET', httpPath: '/api/v1/alert/delivery-history' } }))
      .toBe('GET /api/v1/alert/delivery-history')
  })

  it('supports historical events without endpoint metadata', () => {
    expect(endpointFrom({ metadata: {} })).toBe('—')
  })
})
