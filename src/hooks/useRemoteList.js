import { useCallback, useEffect, useRef, useState } from 'react'
import { listFrom } from '../services/http'

export function useRemoteList(loader, dependencyKey = 'default', enabled = true) {
  const [state, setState] = useState({ data: [], loading: enabled, error: '' })
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const load = useCallback((signal) => {
    if (!enabled) {
      setState({ data: [], loading: false, error: '' })
      return Promise.resolve()
    }
    setState((current) => ({ ...current, loading: true, error: '' }))
    return loaderRef.current(signal).then((payload) => setState({ data: listFrom(payload), loading: false, error: '' })).catch((error) => {
      if (error.name !== 'AbortError') setState({ data: [], loading: false, error: error.message })
    })
  }, [enabled])
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort() }, [load, dependencyKey])
  return { ...state, reload: () => load() }
}
