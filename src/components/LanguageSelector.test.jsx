import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import LanguageSelector from './LanguageSelector'
import { LanguageProvider } from '../store/LanguageContext'

describe('LanguageSelector', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.lang = '' })

  it('uses English by default and switches to Indonesian', async () => {
    render(<LanguageProvider><LanguageSelector /></LanguageProvider>)
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'id' } })
    await waitFor(() => expect(document.documentElement.lang).toBe('id'))
    expect(window.localStorage.getItem('control-room-language')).toBe('id')
  })
})
