import { describe, expect, it } from 'vitest'
import { hasAnyPermission, hasPermission, PERMISSIONS } from './permissions'

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
})
