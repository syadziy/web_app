import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Field } from '../components/ui'
import { useAuth } from '../store/AuthContext'

export default function LoginPage() {
    const { session, login } = useAuth(); const navigate = useNavigate(); const location = useLocation()
    const [form, setForm] = useState({ tenantKey: '', username: '', password: '' }); const [state, setState] = useState({ loading: false, error: '' })
    if (session) return <Navigate to="/" replace />
    const submit = async (event) => { event.preventDefault(); setState({ loading: true, error: '' }); try { await login(form); navigate(location.state?.from || '/', { replace: true }) } catch (error) { setState({ loading: false, error: error.message }) } }
    return <main className="login-page"><section className="login-intro"><span className="brand__mark">C</span><p className="eyebrow">CENTRALIZED SERVICE</p><h1>One room.<br />Every signal.</h1><p>Pantau identitas, jadwal, alert, dan audit dari satu pusat operasi yang tenang.</p><div className="signal-lines"><i /><i /><i /><i /></div></section><section className="login-card"><div><p className="eyebrow">SECURE ACCESS</p><h2>Selamat datang kembali</h2><p>Gunakan kredensial User Management Anda.</p></div><form onSubmit={submit}><Field label="Tenant key" name="tenantKey" required autoComplete="organization" value={form.tenantKey} onChange={(e) => setForm({ ...form, tenantKey: e.target.value })} placeholder="acme-operations" /><Field label="Username" name="username" required autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="operator" /><Field label="Password" name="password" type="password" minLength="12" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••••••" />{state.error && <p className="form-error" role="alert">{state.error}</p>}<Button disabled={state.loading}>{state.loading ? 'Memverifikasi…' : 'Masuk ke dashboard →'}</Button></form><small>Token hanya disimpan selama tab aplikasi aktif.</small></section></main>
}
