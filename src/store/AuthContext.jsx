import { createContext, useContext, useMemo, useState } from 'react'
import { authApi } from '../services/api'
import { setAccessToken } from '../services/http'
import { normalizeSession } from './session'
import { hasAnyPermission, hasPermission } from './permissions'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const login = async (credentials) => {
    const response = await authApi.login(credentials)
    const session = normalizeSession(response)
    if (!session?.accessToken || !session?.tenantId) throw new Error('Respons login tidak valid')
    setAccessToken(session.accessToken)
    setSession(session)
    return session
  }
  const logout = () => { setAccessToken(''); setSession(null) }
  const value = useMemo(() => ({
    session,
    login,
    logout,
    can: (permission) => hasPermission(session, permission),
    canAny: (permissions) => hasAnyPermission(session, permissions),
  }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
