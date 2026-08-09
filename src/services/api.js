import { request } from './http'

export const authApi = { login: (data) => request('/api/v1/auth/login', { method: 'POST', body: data }) }
export const identityApi = {
  registerTenant: (data) => request('/api/v1/tenants', { method: 'POST', body: data }),
  updateTokenPolicy: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/token-policy`, { method: 'PATCH', body: data }),
  users: (tenantId, signal) => request(`/api/v1/tenants/${tenantId}/users`, { signal }),
  createUser: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/users`, { method: 'POST', body: data }),
  assignRoles: (tenantId, userId, roleIds) => request(`/api/v1/tenants/${tenantId}/users/${userId}/roles`, { method: 'PUT', body: { roleIds } }),
  roles: (tenantId, signal) => request(`/api/v1/tenants/${tenantId}/roles`, { signal }),
  createRole: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/roles`, { method: 'POST', body: data }),
  permissions: (tenantId, signal) => request(`/api/v1/tenants/${tenantId}/permissions`, { signal }),
  createPermission: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/permissions`, { method: 'POST', body: data }),
}
export const schedulerApi = {
  createTask: (data) => request('/api/v1/tasks', { method: 'POST', body: data }),
  createGroup: (data) => request('/api/v1/task-groups', { method: 'POST', body: data }),
  createSchedule: (data) => request('/api/v1/schedules', { method: 'POST', body: data }),
  histories: (params, signal) => request(`/api/v1/histories?${new URLSearchParams(params)}`, { signal }),
}
export const alertApi = {
  create: (data) => request('/api/v1/alert', { method: 'POST', body: data }),
  dispatch: (alertId) => request(`/api/v1/alert/${alertId}/dispatch`, { method: 'POST' }),
}
export const auditApi = {
  list: (params, signal) => request(`/api/v1/audit-logs?${new URLSearchParams(params)}`, { signal }),
  detail: (eventId, signal) => request(`/api/v1/audit-logs/${eventId}`, { signal }),
}
