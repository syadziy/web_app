import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import RealtimeNotifications from '../components/RealtimeNotifications'
import ThemeSelector from '../components/ThemeSelector'

const navigation = [
  ['/', 'Overview', '⌁'], ['/tenants', 'Tenants', '◇'], ['/identity', 'Identity', '◎'], ['/scheduler', 'Scheduler', '◷'], ['/alerts', 'Alerts', '🔔'], ['/audit', 'Audit log', '≡'],
]
export default function AppLayout() {
  const { session, logout } = useAuth(); const location = useLocation()
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand__mark">C</span><div><strong>Control Room</strong><small>Service operations</small></div></div><nav aria-label="Navigasi utama">{navigation.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/'}><span>{icon}</span>{label}</NavLink>)}</nav><div className="sidebar__foot"><span className="system-pulse" /> API Gateway<p>localhost:9001</p></div></aside><div className="workspace"><header className="topbar"><div><span className="breadcrumb">Control Room / {navigation.find(([to]) => to === location.pathname)?.[1] || 'Page'}</span><h1>{navigation.find(([to]) => to === location.pathname)?.[1] || 'Dashboard'}</h1></div><div className="user-menu"><ThemeSelector /><RealtimeNotifications token={session?.accessToken} /><span>{session?.username || session?.roles?.[0] || 'Operator'}</span><button onClick={logout}>Keluar</button></div></header><main><Outlet /></main></div></div>
}
