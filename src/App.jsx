import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import IdentityPage from './pages/IdentityPage'
import SchedulerPage from './pages/SchedulerPage'
import AlertsPage from './pages/AlertsPage'
import AuditPage from './pages/AuditPage'
import TenantPage from './pages/TenantPage'
import { useAuth } from './store/AuthContext'
import { ALERT_PERMISSIONS, IDENTITY_PERMISSIONS, PERMISSIONS } from './store/permissions'

function ProtectedRoute() { const { session } = useAuth(); const location = useLocation(); return session ? <AppLayout /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
function PermissionRoute({ anyOf, children }) { const { canAny } = useAuth(); return canAny(anyOf) ? children : <Navigate to="/" replace /> }
export default function App() { return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route index element={<OverviewPage />} /><Route path="tenants" element={<PermissionRoute anyOf={[PERMISSIONS.TENANT_VIEW]}><TenantPage /></PermissionRoute>} /><Route path="identity" element={<PermissionRoute anyOf={IDENTITY_PERMISSIONS}><IdentityPage /></PermissionRoute>} /><Route path="scheduler" element={<PermissionRoute anyOf={[PERMISSIONS.SCHEDULER_READ, PERMISSIONS.SCHEDULER_MANAGE]}><SchedulerPage /></PermissionRoute>} /><Route path="alerts" element={<PermissionRoute anyOf={ALERT_PERMISSIONS}><AlertsPage /></PermissionRoute>} /><Route path="audit" element={<PermissionRoute anyOf={[PERMISSIONS.AUDIT_READ]}><AuditPage /></PermissionRoute>} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes> }
