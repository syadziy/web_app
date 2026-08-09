import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ThemeSelector from './ThemeSelector'
import { ThemeProvider } from '../store/ThemeContext'

describe('ThemeSelector', () => {
  beforeEach(() => { window.localStorage.clear(); delete document.documentElement.dataset.theme })
  afterEach(cleanup)

  it('changes and persists the selected color palette', async () => {
    render(<ThemeProvider><ThemeSelector /></ThemeProvider>)
    fireEvent.change(screen.getByLabelText('Color palette'), { target: { value: 'salt-pepper' } })

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('salt-pepper'))
    expect(window.localStorage.getItem('control-room-theme')).toBe('salt-pepper')
  })

  it('offers the Apple color palette', () => {
    render(<ThemeProvider><ThemeSelector /></ThemeProvider>)
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveValue('apple')
    expect(screen.getByLabelText('Color palette')).toHaveValue('apple')
  })
})
