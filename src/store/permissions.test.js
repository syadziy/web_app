import { describe, expect, it } from 'vitest'
import { hasAnyPermission, hasPermission, isPlatformSuperadmin, PERMISSIONS } from './permissions'

describe('permission helpers', () => {
  const session = { permissions: [PERMISSIONS.TENANT_VIEW, PERMISSIONS.USER_CREATE] }

  it('checks one exact backend permission', () => {
    expect(hasPermission(session, PERMISSIONS.TENANT_VIEW)).toBe(true)
    expect(hasPermission(session, PERMISSIONS.TENANT_UPDATE)).toBe(false)
  })

  it('checks whether at least one page permission is granted', () => {
    expect(hasAnyPermission(session, [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE])).toBe(true)
    expect(hasAnyPermission(session, [PERMISSIONS.AUDIT_READ])).toBe(false)
    expect(hasAnyPermission(null, [PERMISSIONS.TENANT_VIEW])).toBe(false)
  })

  it('keeps gateway log access separate from audit log access', () => {
    const auditReader = { permissions: [PERMISSIONS.AUDIT_READ] }
    const gatewayLogReader = { permissions: [PERMISSIONS.GATEWAY_LOG_READ] }

    expect(hasPermission(auditReader, PERMISSIONS.GATEWAY_LOG_READ)).toBe(false)
    expect(hasPermission(gatewayLogReader, PERMISSIONS.GATEWAY_LOG_READ)).toBe(true)
  })

  it('bypasses permission checks only for the platform superadmin tenant', () => {
    const platformSuperadmin = { tenantKey: 'superadmin', permissions: [] }
    const regularTenant = { tenantKey: 'acme-id', permissions: [] }

    expect(isPlatformSuperadmin(platformSuperadmin)).toBe(true)
    expect(hasPermission(platformSuperadmin, PERMISSIONS.GATEWAY_LOG_READ)).toBe(true)
    expect(hasPermission(regularTenant, PERMISSIONS.GATEWAY_LOG_READ)).toBe(false)
  })
})
