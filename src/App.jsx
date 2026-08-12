import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import IdentityPage from './pages/IdentityPage'
import SchedulerPage from './pages/SchedulerPage'
import AlertsPage from './pages/AlertsPage'
import AuditPage from './pages/AuditPage'
import GatewayLogsPage from './pages/GatewayLogsPage'
import TenantPage from './pages/TenantPage'
import { useAuth } from './store/AuthContext'
import { ALERT_PERMISSIONS, IDENTITY_PERMISSIONS, isPlatformSuperadmin, PERMISSIONS } from './store/permissions'

function ProtectedRoute() { const { session, initializing } = useAuth(); const location = useLocation(); if (initializing) return null; return session ? <AppLayout /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
function PermissionRoute({ anyOf, children }) { const { canAny } = useAuth(); return canAny(anyOf) ? children : <Navigate to="/" replace /> }
function PlatformTenantRoute({ children }) { const { session } = useAuth(); return isPlatformSuperadmin(session) ? children : <Navigate to="/" replace /> }
export default function App() { return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route index element={<OverviewPage />} /><Route path="tenants" element={<PlatformTenantRoute><TenantPage /></PlatformTenantRoute>} /><Route path="identity" element={<PermissionRoute anyOf={IDENTITY_PERMISSIONS}><IdentityPage /></PermissionRoute>} /><Route path="scheduler" element={<PermissionRoute anyOf={[PERMISSIONS.SCHEDULER_READ, PERMISSIONS.SCHEDULER_MANAGE]}><SchedulerPage /></PermissionRoute>} /><Route path="alerts" element={<PermissionRoute anyOf={ALERT_PERMISSIONS}><AlertsPage /></PermissionRoute>} /><Route path="audit" element={<PermissionRoute anyOf={[PERMISSIONS.AUDIT_READ]}><AuditPage /></PermissionRoute>} /><Route path="gateway-logs" element={<PermissionRoute anyOf={[PERMISSIONS.GATEWAY_LOG_READ]}><GatewayLogsPage /></PermissionRoute>} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes> }
