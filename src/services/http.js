const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:9001').replace(/\/$/, '')
const CLIENT_ID = import.meta.env.VITE_API_CLIENT_ID || 'operations-ui'

let accessToken = ''
export const setAccessToken = (token) => { accessToken = token || '' }

export class ApiError extends Error {
  constructor(message, status, details) { super(message); this.name = 'ApiError'; this.status = status; this.details = details }
}

export async function request(path, options = {}) {
  const { method = 'GET', body, signal, headers = {} } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Client-Id': CLIENT_ID,
      'X-Correlation-Id': crypto.randomUUID(),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) throw new ApiError('The request could not be completed. Check the submitted data and try again.', response.status, payload)
  return payload
}

export const listFrom = (payload) => Array.isArray(payload) ? payload : payload?.content || payload?.items || payload?.data || []
export const pagingFrom = (payload, limit, offset, rowCount) => {
  const paging = payload?.paging || payload?.page || {}
  const total = Number(paging.total ?? paging.totalElements ?? payload?.total ?? payload?.totalElements)
  return { limit, offset, total: Number.isFinite(total) ? total : offset + rowCount + (rowCount === limit ? 1 : 0) }
}
