import { useState } from 'react'
import { Badge, Button, DataTable, Field, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { identityApi } from '../services/api'
import { useAuth } from '../store/AuthContext'

const initialForm = {
  tenantKey: '',
  tenantName: '',
  accessTokenTtlSeconds: '3600',
  ownerUsername: '',
  ownerEmail: '',
  ownerPassword: '',
}

export default function TenantPage() {
  const { session } = useAuth()
  const canListTenants = session?.permissions?.includes('tenant:view')
  const tenants = useRemoteList((signal, page) => canListTenants ? identityApi.tenants(page, signal) : Promise.resolve([]), canListTenants, true, { defaultLimit: 10, options: [10, 50, 100, 500] })
  const [tab, setTab] = useState(canListTenants ? 'list' : 'register')
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(null)
  const notice = useNotice()
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setCreated(null)
    try {
      const response = await identityApi.registerTenant({ ...form, accessTokenTtlSeconds: Number(form.accessTokenTtlSeconds) })
      const tenant = response?.data ?? response
      setCreated(tenant)
      setForm(initialForm)
      if (canListTenants) tenants.reload()
      notice.success(`Tenant ${tenant.tenantKey || form.tenantKey} berhasil dibuat.`)
    } catch (error) {
      notice.fail(error.message)
    } finally {
      setSaving(false)
    }
  }

  const tenantColumns = [
    { key: 'tenantName', label: 'Tenant', render: (row) => <div className="tenant-name"><strong>{row.tenantName}</strong><small>{row.tenantKey}</small></div> },
    { key: 'tenantId', label: 'Tenant ID', render: (row) => <span className="mono">{row.tenantId}</span> },
    { key: 'accessTokenTtlSeconds', label: 'Token TTL', render: (row) => `${Math.round(row.accessTokenTtlSeconds / 60)} menit` },
    { key: 'createdAt', label: 'Dibuat', render: (row) => row.createdAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.createdAt)) : '—' },
    { key: 'enabled', label: 'Status', render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Disabled'}</Badge> },
  ]

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h2>Tenant management</h2><p>Kelola tenant dan siapkan akun superadmin pertamanya.</p></div></section>
    {canListTenants && <div className="section-tabs" role="tablist"><button role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>Tenant list <span>{tenants.data.length}</span></button><button role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}>Registrasi tenant</button></div>}
    {tab === 'list' && canListTenants ? <Panel title="Tenant directory" eyebrow="AUTHORIZED TENANTS" actions={<Button variant="ghost" onClick={tenants.reload}>Refresh</Button>}>
      <Status loading={tenants.loading} error={tenants.error} empty={!tenants.data.length} onRetry={tenants.reload} />
      {!tenants.loading && !tenants.error && tenants.data.length > 0 && <DataTable rows={tenants.data} columns={tenantColumns} rowKey="tenantId" pagination={tenants.pagination} />}
    </Panel> : <div className="tenant-onboarding">
      <Panel title="Tenant baru" eyebrow="ONBOARDING" className="tenant-form-panel">
        <form className="tenant-form" onSubmit={submit}>
          <fieldset><legend>Informasi tenant</legend><div className="form-grid form-grid--two">
            <Field label="Tenant key" name="tenantKey" required pattern="[a-z0-9][a-z0-9-]{2,63}" maxLength="64" value={form.tenantKey} onChange={update} placeholder="syadziy-company" hint="Huruf kecil, angka, dan tanda hubung; minimal 3 karakter." />
            <Field label="Nama tenant" name="tenantName" required maxLength="150" value={form.tenantName} onChange={update} placeholder="Syadziy Company" hint="Minimal 3 karakter." />
            <Field label="Masa aktif access token" name="accessTokenTtlSeconds" as="select" required value={form.accessTokenTtlSeconds} onChange={update} options={[{ value: '900', label: '15 menit' }, { value: '1800', label: '30 menit' }, { value: '3600', label: '1 jam' }, { value: '28800', label: '8 jam' }, { value: '86400', label: '24 jam' }]} />
          </div></fieldset>
          <fieldset><legend>Akun owner</legend><div className="form-grid form-grid--two">
            <Field label="Username owner" name="ownerUsername" required pattern="[A-Za-z0-9._-]{3,80}" value={form.ownerUsername} onChange={update} placeholder="tenant.owner" />
            <Field label="Email owner" name="ownerEmail" type="email" required maxLength="254" value={form.ownerEmail} onChange={update} placeholder="owner@company.com" />
            <Field label="Password owner" name="ownerPassword" type="password" required minLength="12" maxLength="72" value={form.ownerPassword} onChange={update} autoComplete="new-password" hint="Minimal 12 karakter." />
          </div></fieldset>
          <div className="tenant-form__footer"><p>Akun owner otomatis memperoleh role <strong>SUPERADMIN</strong> pada tenant baru.</p><Button disabled={saving}>{saving ? 'Mendaftarkan…' : 'Daftarkan tenant'}</Button></div>
        </form>
      </Panel>
      <aside className="tenant-guidance"><p className="eyebrow">WHAT HAPPENS NEXT</p><h3>Siap dalam satu langkah</h3><ol><li>Tenant dan kebijakan token dibuat.</li><li>Permission standar disiapkan.</li><li>Owner mendapat akses superadmin.</li></ol></aside>
    </div>}
    {created && <section className="info-card tenant-created"><strong>Tenant siap digunakan</strong><p>Login menggunakan tenant key <span className="mono">{created.tenantKey}</span> dan kredensial owner yang baru dibuat.</p></section>}
  </div>
}
