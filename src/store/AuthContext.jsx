import { createContext, useContext, useMemo, useState } from 'react'
import { authApi } from '../services/api'
import { setAccessToken } from '../services/http'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const login = async (credentials) => { const data = await authApi.login(credentials); setAccessToken(data.accessToken); setSession(data); return data }
  const logout = () => { setAccessToken(''); setSession(null) }
  const value = useMemo(() => ({ session, login, logout }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
