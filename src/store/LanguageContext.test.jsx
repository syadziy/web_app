import { describe, expect, it } from 'vitest'
import { messages } from './LanguageContext'

describe('language catalog', () => {
  it('keeps English and Indonesian translation keys in sync', () => {
    expect(Object.keys(messages.id).sort()).toEqual(Object.keys(messages.en).sort())
  })

  it('does not contain empty translations', () => {
    Object.values(messages).forEach((catalog) => {
      expect(Object.values(catalog).every((message) => message.trim().length > 0)).toBe(true)
    })
  })
})
