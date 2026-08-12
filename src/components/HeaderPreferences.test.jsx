import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HeaderPreferences from './HeaderPreferences'

vi.mock('./ThemeSelector', () => ({ default: () => <div>Theme choices</div> }))
vi.mock('./LanguageSelector', () => ({ default: () => <div>Language choices</div> }))
vi.mock('../store/LanguageContext', () => ({ useLanguage: () => ({ t: () => 'Theme and language' }) }))

describe('HeaderPreferences', () => {
  afterEach(cleanup)

  it('opens below the mobile preferences trigger and closes with Escape', () => {
    render(<HeaderPreferences />)
    const trigger = screen.getByRole('button', { name: 'Theme and language' })

    fireEvent.click(trigger)
    expect(screen.getByRole('region', { name: 'Theme and language' })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'Theme and language' })).not.toBeInTheDocument()
  })
})
