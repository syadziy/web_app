export const PERMISSIONS = Object.freeze({
  TENANT_VIEW: 'tenant:view',
  TENANT_UPDATE: 'tenant:update',
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_EDIT: 'role:edit',
  ROLE_ASSIGN: 'role:assign',
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_CREATE: 'permission:create',
  SCHEDULER_READ: 'scheduler:read',
  SCHEDULER_MANAGE: 'scheduler:manage',
  ALERT_WRITE: 'alert:write',
  ALERT_READ_RECIPIENTS: 'alert:read-recipients',
  ALERT_MANAGE_RECIPIENTS: 'alert:manage-recipients',
  ALERT_READ_NOTIFICATIONS: 'alert:read-notifications',
  AUDIT_READ: 'audit:read',
})

export const IDENTITY_PERMISSIONS = [
  PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.ROLE_VIEW,
  PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_EDIT, PERMISSIONS.ROLE_ASSIGN,
  PERMISSIONS.PERMISSION_VIEW, PERMISSIONS.PERMISSION_CREATE,
]

export const ALERT_PERMISSIONS = [
  PERMISSIONS.ALERT_WRITE, PERMISSIONS.ALERT_READ_RECIPIENTS,
  PERMISSIONS.ALERT_MANAGE_RECIPIENTS, PERMISSIONS.ALERT_READ_NOTIFICATIONS,
]

export const hasPermission = (session, permission) =>
  Boolean(permission && session?.permissions?.includes(permission))

export const hasAnyPermission = (session, permissions = []) =>
  permissions.some((permission) => hasPermission(session, permission))
