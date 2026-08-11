import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import RealtimeNotifications from '../components/RealtimeNotifications'
import ThemeSelector from '../components/ThemeSelector'
import LanguageSelector from '../components/LanguageSelector'
import { useLanguage } from '../store/LanguageContext'
import { ALERT_PERMISSIONS, IDENTITY_PERMISSIONS, PERMISSIONS } from '../store/permissions'

const navigation = [
  { to: '/', labelKey: 'overview', icon: '⌁' },
  { to: '/tenants', labelKey: 'tenants', icon: '◇', permissions: [PERMISSIONS.TENANT_VIEW] },
  { to: '/identity', labelKey: 'identity', icon: '◎', permissions: IDENTITY_PERMISSIONS },
  { to: '/scheduler', labelKey: 'scheduler', icon: '◷', permissions: [PERMISSIONS.SCHEDULER_READ, PERMISSIONS.SCHEDULER_MANAGE] },
  { to: '/alerts', labelKey: 'alerts', icon: '🔔', permissions: ALERT_PERMISSIONS },
  { to: '/audit', labelKey: 'auditLog', icon: '≡', permissions: [PERMISSIONS.AUDIT_READ] },
]
export default function AppLayout() {
  const { session, logout, can, canAny } = useAuth(); const location = useLocation()
  const { t } = useLanguage()
  const visibleNavigation = navigation.filter((item) => !item.permissions || canAny(item.permissions))
  const current = navigation.find((item) => item.to === location.pathname)
  const currentLabel = current ? t(current.labelKey) : 'Dashboard'
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand__mark">C</span><div><strong>Control Room</strong><small>Service operations</small></div></div><nav aria-label={t('mainNavigation')}>{visibleNavigation.map(({ to, labelKey, icon }) => <NavLink key={to} to={to} end={to === '/'}><span>{icon}</span>{t(labelKey)}</NavLink>)}</nav><div className="sidebar__foot"><span className="system-pulse" /> API Gateway<p>localhost:9001</p></div></aside><div className="workspace"><header className="topbar"><div><span className="breadcrumb">Control Room / {currentLabel}</span><h1>{currentLabel}</h1></div><div className="user-menu"><ThemeSelector /><LanguageSelector />{can(PERMISSIONS.ALERT_READ_NOTIFICATIONS) && <RealtimeNotifications token={session?.accessToken} />}<span>{session?.username || session?.roles?.[0] || 'Operator'}</span><button onClick={logout}>{t('logout')}</button></div></header><main><Outlet /></main></div></div>
}
