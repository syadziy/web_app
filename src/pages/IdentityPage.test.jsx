import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import IdentityPage from './IdentityPage'

const auth = vi.hoisted(() => ({
  session: { tenantId: 'platform-id', tenantKey: 'superadmin' },
  can: vi.fn(() => true),
}))
const api = vi.hoisted(() => ({
  tenants: vi.fn(),
  users: vi.fn(),
  roles: vi.fn(),
  permissions: vi.fn(),
  createUser: vi.fn(),
  assignRoles: vi.fn(),
  createRole: vi.fn(),
  createPermission: vi.fn(),
}))

vi.mock('../store/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../store/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => ({ manageTenant: 'Manage tenant' })[key] || key }),
}))
vi.mock('../services/api', () => ({ identityApi: api }))

const emptyPage = { data: [], paging: { total_record: 0 } }

describe('IdentityPage tenant selection', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    auth.session = { tenantId: 'platform-id', tenantKey: 'superadmin' }
    api.tenants.mockResolvedValue({
      data: [
        { tenantId: 'platform-id', tenantKey: 'superadmin', tenantName: 'Platform' },
        { tenantId: 'acme-id', tenantKey: 'acme', tenantName: 'Acme Operations' },
      ],
      paging: { total_record: 2 },
    })
    api.users.mockResolvedValue(emptyPage)
    api.roles.mockResolvedValue(emptyPage)
    api.permissions.mockResolvedValue(emptyPage)
  })

  it('reloads identity resources for the tenant selected by a platform superadmin', async () => {
    api.tenants.mockResolvedValue({
      data: [
        { tenantId: 'platform-id', tenantKey: 'superadmin', tenantName: 'Platform' },
        { tenantId: 'acme-id', tenantKey: 'acme', tenantName: 'Acme Operations' },
      ],
      paging: { total_record: 2 },
    })
    api.users.mockResolvedValue(emptyPage)
    api.roles.mockResolvedValue(emptyPage)
    api.permissions.mockResolvedValue(emptyPage)

    render(<IdentityPage />)

    const tenantSelect = await screen.findByRole('combobox', { name: 'Manage tenant' })
    await waitFor(() => expect(tenantSelect).not.toBeDisabled())
    fireEvent.click(tenantSelect)
    fireEvent.click(screen.getByRole('option', { name: 'Acme Operations (acme)' }))

    await waitFor(() => {
      expect(api.users).toHaveBeenCalledWith('acme-id', { limit: 10, offset: 0 }, expect.any(AbortSignal))
      expect(api.roles).toHaveBeenCalledWith('acme-id', { limit: 10, offset: 0 }, expect.any(AbortSignal))
      expect(api.permissions).toHaveBeenCalledWith('acme-id', { limit: 10, offset: 0 }, expect.any(AbortSignal))
    })
  })

  it('keeps tenant selection hidden and does not load the directory for regular tenants', async () => {
    auth.session = { tenantId: 'acme-id', tenantKey: 'acme' }
    api.users.mockResolvedValue(emptyPage)
    api.roles.mockResolvedValue(emptyPage)
    api.permissions.mockResolvedValue(emptyPage)

    render(<IdentityPage />)

    await waitFor(() => expect(api.users).toHaveBeenCalled())
    expect(screen.queryByRole('combobox', { name: 'Manage tenant' })).not.toBeInTheDocument()
    expect(api.tenants).not.toHaveBeenCalled()
  })
})
