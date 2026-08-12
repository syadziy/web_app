import { describe, expect, it } from 'vitest'
import { responseData, statusTone } from './gatewayLogs'

describe('gateway log presentation', () => {
  it('classifies successful and failed responses', () => {
    expect(statusTone(204)).toBe('success')
    expect(statusTone(404)).toBe('error')
  })

  it('unwraps gateway log detail responses', () => {
    expect(responseData({ data: { eventId: 'event-1' } })).toEqual({ eventId: 'event-1' })
  })
})
