import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import RealtimeNotifications from '../components/RealtimeNotifications'
import HeaderPreferences from '../components/HeaderPreferences'
import { useLanguage } from '../store/LanguageContext'
import { ALERT_PERMISSIONS, IDENTITY_PERMISSIONS, isPlatformSuperadmin, PERMISSIONS } from '../store/permissions'
import { MaterialIcon } from '../components/ui'

const navigation = [
  { to: '/', labelKey: 'overview', icon: 'dashboard' },
  { to: '/tenants', labelKey: 'tenants', icon: 'domain', platformTenantOnly: true },
  { to: '/identity', labelKey: 'identity', icon: 'manage_accounts', permissions: IDENTITY_PERMISSIONS },
  { to: '/scheduler', labelKey: 'scheduler', icon: 'schedule', permissions: [PERMISSIONS.SCHEDULER_READ, PERMISSIONS.SCHEDULER_MANAGE] },
  { to: '/alerts', labelKey: 'alerts', icon: 'notifications', permissions: ALERT_PERMISSIONS },
  { to: '/audit', labelKey: 'auditLog', icon: 'fact_check', permissions: [PERMISSIONS.AUDIT_READ] },
  { to: '/gateway-logs', labelKey: 'gatewayLogs', icon: 'receipt_long', permissions: [PERMISSIONS.GATEWAY_LOG_READ] },
]
export default function AppLayout() {
  const { session, logout, can, canAny } = useAuth(); const location = useLocation()
  const { t } = useLanguage()
  const visibleNavigation = navigation.filter((item) =>
    (!item.platformTenantOnly || isPlatformSuperadmin(session))
    && (!item.permissions || canAny(item.permissions)))
  const current = navigation.find((item) => item.to === location.pathname)
  const currentLabel = current ? t(current.labelKey) : t('dashboard')
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand__mark">C</span><div><strong>Control Room</strong><small>{t('serviceOperations')}</small></div></div><nav aria-label={t('mainNavigation')}>{visibleNavigation.map(({ to, labelKey, icon }) => <NavLink key={to} to={to} end={to === '/'}><MaterialIcon name={icon} />{t(labelKey)}</NavLink>)}</nav><div className="sidebar__foot"><span className="system-pulse" /> API Gateway<p>localhost:9001</p></div></aside><div className="workspace"><header className="topbar"><div><span className="breadcrumb">Control Room / {currentLabel}</span><h1>{currentLabel}</h1></div><div className="user-menu"><HeaderPreferences />{can(PERMISSIONS.ALERT_READ_NOTIFICATIONS) && <RealtimeNotifications />}<span className="user-name">{session?.username || session?.roles?.[0] || 'Operator'}</span><button onClick={logout}>{t('logout')}</button></div></header><main><Outlet /></main></div></div>
}
