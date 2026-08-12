export function endpointFrom(row) {
  const method = row?.metadata?.httpMethod
  const path = row?.metadata?.httpPath
  return [method, path].filter(Boolean).join(' ') || '—'
}
