import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import IdentityPage from './pages/IdentityPage'
import SchedulerPage from './pages/SchedulerPage'
import AlertsPage from './pages/AlertsPage'
import AuditPage from './pages/AuditPage'
import { useAuth } from './store/AuthContext'

function ProtectedRoute() { const { session } = useAuth(); const location = useLocation(); return session ? <AppLayout /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
export default function App() { return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route index element={<OverviewPage />} /><Route path="identity" element={<IdentityPage />} /><Route path="scheduler" element={<SchedulerPage />} /><Route path="alerts" element={<AlertsPage />} /><Route path="audit" element={<AuditPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes> }
