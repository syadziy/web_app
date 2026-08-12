import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({ session: null, initializing: false, login: vi.fn() }),
}))
vi.mock('../store/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => ({ password: 'Password', showPassword: 'Show password', hidePassword: 'Hide password' })[key] || key }),
}))
vi.mock('../components/ThemeSelector', () => ({ default: () => null }))
vi.mock('../components/LanguageSelector', () => ({ default: () => null }))

describe('LoginPage', () => {
  it('toggles password visibility without changing its value', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    const password = screen.getByLabelText('Password')

    fireEvent.change(password, { target: { value: 'strong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('strong-password')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true')
  })
})
