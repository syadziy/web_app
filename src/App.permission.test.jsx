import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { PERMISSIONS } from './store/permissions'

const auth = vi.hoisted(() => ({ permissions: [], tenantKey: 'acme-id' }))

vi.mock('./store/AuthContext', () => ({
  useAuth: () => ({
    session: { username: 'operator', tenantKey: auth.tenantKey, permissions: auth.permissions },
    initializing: false,
    logout: vi.fn(),
    can: (permission) => auth.permissions.includes(permission),
    canAny: (permissions) => permissions.some((permission) => auth.permissions.includes(permission)),
  }),
}))
vi.mock('./components/HeaderPreferences', () => ({ default: () => null }))
vi.mock('./components/RealtimeNotifications', () => ({ default: () => null }))
vi.mock('./pages/GatewayLogsPage', () => ({ default: () => <div>Gateway log monitoring page</div> }))

describe('gateway log authorization', () => {
  afterEach(() => { cleanup(); auth.permissions = []; auth.tenantKey = 'acme-id' })

  it('hides the menu and rejects the direct route for an audit-only user', async () => {
    auth.permissions = [PERMISSIONS.AUDIT_READ]
    render(<MemoryRouter initialEntries={['/gateway-logs']}><App /></MemoryRouter>)

    expect(await screen.findByText('Good systems feel quiet.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Gateway logs' })).not.toBeInTheDocument()
    expect(screen.queryByText('Gateway log monitoring page')).not.toBeInTheDocument()
  })

  it('shows the menu and direct route with the dedicated permission', () => {
    auth.permissions = [PERMISSIONS.GATEWAY_LOG_READ]
    render(<MemoryRouter initialEntries={['/gateway-logs']}><App /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Gateway logs' })).toBeInTheDocument()
    expect(screen.getByText('Gateway log monitoring page')).toBeInTheDocument()
  })
})

describe('tenant menu authorization', () => {
  afterEach(() => { cleanup(); auth.permissions = []; auth.tenantKey = 'acme-id' })

  it('hides the menu and rejects the direct route for a regular tenant with tenant view', async () => {
    auth.permissions = [PERMISSIONS.TENANT_VIEW]
    render(<MemoryRouter initialEntries={['/tenants']}><App /></MemoryRouter>)

    expect(await screen.findByText('Good systems feel quiet.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Tenants' })).not.toBeInTheDocument()
  })

  it('shows the tenant menu for the platform superadmin tenant', () => {
    auth.tenantKey = 'superadmin'
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Tenants' })).toBeInTheDocument()
  })
})
