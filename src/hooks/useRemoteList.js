import { useCallback, useEffect, useRef, useState } from 'react'
import { listFrom, pagingFrom } from '../services/http'

export function useRemoteList(loader, dependencyKey = 'default', enabled = true, paginationConfig) {
  const paginated = Boolean(paginationConfig)
  const [paginationState, setPaginationState] = useState(() => ({ limit: paginationConfig?.defaultLimit || 10, offset: 0 }))
  const [state, setState] = useState({ data: [], loading: enabled, error: '' })
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const load = useCallback((signal) => {
    if (!enabled) {
      setState({ data: [], loading: false, error: '' })
      return Promise.resolve()
    }
    setState((current) => ({ ...current, loading: true, error: '' }))
    return loaderRef.current(signal, paginationState).then((payload) => {
      const data = listFrom(payload)
      const paging = pagingFrom(payload, paginationState.limit, paginationState.offset, data.length)
      if (paginated && paging.total > 0 && paginationState.offset >= paging.total) {
        const lastOffset = Math.floor((paging.total - 1) / paginationState.limit) * paginationState.limit
        setPaginationState((current) => ({ ...current, offset: lastOffset }))
        return
      }
      setState({ data, paging, loading: false, error: '' })
    }).catch((error) => {
      if (error.name !== 'AbortError') setState({ data: [], loading: false, error: error.message })
    })
  }, [enabled, paginated, paginationState])
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort() }, [load, dependencyKey])
  const pagination = paginationConfig ? {
    ...paginationState,
    total: state.paging?.total ?? 0,
    options: paginationConfig.options,
    onChange: (next) => setPaginationState(next),
  } : undefined
  return { ...state, pagination, reload: () => load() }
}
