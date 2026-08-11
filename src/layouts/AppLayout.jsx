import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import RealtimeNotifications from '../components/RealtimeNotifications'
import ThemeSelector from '../components/ThemeSelector'
import { ALERT_PERMISSIONS, IDENTITY_PERMISSIONS, PERMISSIONS } from '../store/permissions'

const navigation = [
  { to: '/', label: 'Overview', icon: '⌁' },
  { to: '/tenants', label: 'Tenants', icon: '◇', permissions: [PERMISSIONS.TENANT_VIEW] },
  { to: '/identity', label: 'Identity', icon: '◎', permissions: IDENTITY_PERMISSIONS },
  { to: '/scheduler', label: 'Scheduler', icon: '◷', permissions: [PERMISSIONS.SCHEDULER_READ, PERMISSIONS.SCHEDULER_MANAGE] },
  { to: '/alerts', label: 'Alerts', icon: '🔔', permissions: ALERT_PERMISSIONS },
  { to: '/audit', label: 'Audit log', icon: '≡', permissions: [PERMISSIONS.AUDIT_READ] },
]
export default function AppLayout() {
  const { session, logout, can, canAny } = useAuth(); const location = useLocation()
  const visibleNavigation = navigation.filter((item) => !item.permissions || canAny(item.permissions))
  const current = navigation.find((item) => item.to === location.pathname)
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand__mark">C</span><div><strong>Control Room</strong><small>Service operations</small></div></div><nav aria-label="Navigasi utama">{visibleNavigation.map(({ to, label, icon }) => <NavLink key={to} to={to} end={to === '/'}><span>{icon}</span>{label}</NavLink>)}</nav><div className="sidebar__foot"><span className="system-pulse" /> API Gateway<p>localhost:9001</p></div></aside><div className="workspace"><header className="topbar"><div><span className="breadcrumb">Control Room / {current?.label || 'Page'}</span><h1>{current?.label || 'Dashboard'}</h1></div><div className="user-menu"><ThemeSelector />{can(PERMISSIONS.ALERT_READ_NOTIFICATIONS) && <RealtimeNotifications token={session?.accessToken} />}<span>{session?.username || session?.roles?.[0] || 'Operator'}</span><button onClick={logout}>Keluar</button></div></header><main><Outlet /></main></div></div>
}
