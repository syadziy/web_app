import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'
import { normalizeSession } from './session'
import { hasAnyPermission, hasPermission } from './permissions'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)
  useEffect(() => {
    let active = true
    authApi.session()
      .then((response) => { if (active) setSession(normalizeSession(response)) })
      .catch(() => { if (active) setSession(null) })
      .finally(() => { if (active) setInitializing(false) })
    return () => { active = false }
  }, [])
  const login = async (credentials) => {
    const response = await authApi.login(credentials)
    const session = normalizeSession(response)
    if (!session?.tenantId || !session?.userId) throw new Error('Respons login tidak valid')
    setSession(session)
    return session
  }
  const logout = async () => {
    try { await authApi.logout() }
    finally { setSession(null) }
  }
  const value = useMemo(() => ({
    session,
    initializing,
    login,
    logout,
    can: (permission) => hasPermission(session, permission),
    canAny: (permissions) => hasAnyPermission(session, permissions),
  }), [initializing, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
