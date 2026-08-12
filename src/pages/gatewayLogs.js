export const statusTone = (status) => status >= 200 && status < 400 ? 'success' : 'error'

export const responseData = (payload) => payload?.data ?? payload
