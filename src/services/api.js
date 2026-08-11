import { request } from './http'

export const authApi = { login: (data) => request('/api/v1/auth/login', { method: 'POST', body: data }) }
export const identityApi = {
  registerTenant: (data) => request('/api/v1/tenants', { method: 'POST', body: data }),
  tenants: (params, signal) => request(`/api/v1/tenants?${new URLSearchParams(params)}`, { signal }),
  updateTokenPolicy: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/token-policy`, { method: 'PATCH', body: data }),
  users: (tenantId, params, signal) => request(`/api/v1/tenants/${tenantId}/users?${new URLSearchParams(params)}`, { signal }),
  createUser: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/users`, { method: 'POST', body: data }).then((response) => response?.data ?? response),
  assignRoles: (tenantId, userId, roleIds) => request(`/api/v1/tenants/${tenantId}/users/${userId}/roles`, { method: 'PUT', body: { roleIds } }).then((response) => response?.data ?? response),
  roles: (tenantId, params, signal) => request(`/api/v1/tenants/${tenantId}/roles?${new URLSearchParams(params)}`, { signal }),
  createRole: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/roles`, { method: 'POST', body: data }),
  permissions: (tenantId, params, signal) => request(`/api/v1/tenants/${tenantId}/permissions?${new URLSearchParams(params)}`, { signal }),
  createPermission: (tenantId, data) => request(`/api/v1/tenants/${tenantId}/permissions`, { method: 'POST', body: data }),
}
export const schedulerApi = {
  tasks: (params, signal) => request(`/api/v1/tasks?${new URLSearchParams(params)}`, { signal }),
  groups: (params, signal) => request(`/api/v1/task-groups?${new URLSearchParams(params)}`, { signal }),
  schedules: (params, signal) => request(`/api/v1/schedules?${new URLSearchParams(params)}`, { signal }),
  createTask: (data) => request('/api/v1/tasks', { method: 'POST', body: data }).then((response) => response?.data ?? response),
  createGroup: (data) => request('/api/v1/task-groups', { method: 'POST', body: data }).then((response) => response?.data ?? response),
  createSchedule: (data) => request('/api/v1/schedules', { method: 'POST', body: data }).then((response) => response?.data ?? response),
  histories: (params, signal) => request(`/api/v1/histories?${new URLSearchParams(params)}`, { signal }),
}
export const alertApi = {
  create: (data) => request('/api/v1/alert', { method: 'POST', body: data }),
  dispatch: (alertId) => request(`/api/v1/alert/${alertId}/dispatch`, { method: 'POST' }),
  recipients: (params = {}, signal) => request(`/api/v1/alert/recipients?${new URLSearchParams(params)}`, { signal }),
  deliveryHistory: (params = {}, signal) => request(`/api/v1/alert/delivery-history?${new URLSearchParams(params)}`, { signal }),
  createRecipient: (data) => request('/api/v1/alert/recipients', { method: 'POST', body: data }).then((response) => response?.data ?? response),
  updateRecipient: (id, data) => request(`/api/v1/alert/recipients/${id}`, { method: 'PUT', body: data }).then((response) => response?.data ?? response),
  deleteRecipient: (id) => request(`/api/v1/alert/recipients/${id}`, { method: 'DELETE' }),
}
export const auditApi = {
  list: (params, signal) => request(`/api/v1/audit-logs?${new URLSearchParams(params)}`, { signal }),
  detail: (eventId, signal) => request(`/api/v1/audit-logs/${eventId}`, { signal }),
}
