import { useState } from 'react'
import { Button, Field, Notice, Panel, useNotice } from '../components/ui'
import { identityApi } from '../services/api'

const initialForm = {
  tenantKey: '',
  tenantName: '',
  accessTokenTtlSeconds: '3600',
  ownerUsername: '',
  ownerEmail: '',
  ownerPassword: '',
}

export default function TenantPage() {
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
      notice.success(`Tenant ${tenant.tenantKey || form.tenantKey} berhasil dibuat.`)
    } catch (error) {
      notice.fail(error.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h2>Registrasi tenant</h2><p>Buat ruang tenant baru beserta akun superadmin pertamanya.</p></div></section>
    <Panel title="Tenant baru" eyebrow="ONBOARDING">
      <form className="form-grid form-grid--two tenant-form" onSubmit={submit}>
        <Field label="Tenant key" name="tenantKey" required pattern="[a-z0-9][a-z0-9-]{2,63}" maxLength="64" value={form.tenantKey} onChange={update} placeholder="syadziy-company" hint="Huruf kecil, angka, dan tanda hubung; minimal 3 karakter." />
        <Field label="Nama tenant" name="tenantName" required maxLength="150" value={form.tenantName} onChange={update} placeholder="Syadziy Company" />
        <Field label="Username owner" name="ownerUsername" required pattern="[A-Za-z0-9._-]{3,80}" value={form.ownerUsername} onChange={update} placeholder="tenant.owner" />
        <Field label="Email owner" name="ownerEmail" type="email" required maxLength="254" value={form.ownerEmail} onChange={update} placeholder="owner@company.com" />
        <Field label="Password owner" name="ownerPassword" type="password" required minLength="12" maxLength="72" value={form.ownerPassword} onChange={update} autoComplete="new-password" hint="Minimal 12 karakter." />
        <Field label="Masa aktif access token" name="accessTokenTtlSeconds" as="select" required value={form.accessTokenTtlSeconds} onChange={update} options={[{ value: '900', label: '15 menit' }, { value: '1800', label: '30 menit' }, { value: '3600', label: '1 jam' }, { value: '28800', label: '8 jam' }, { value: '86400', label: '24 jam' }]} />
        <div className="form-actions span-two"><Button disabled={saving}>{saving ? 'Mendaftarkan…' : 'Daftarkan tenant'}</Button></div>
      </form>
    </Panel>
    {created && <section className="info-card tenant-created"><strong>Tenant siap digunakan</strong><p>Login menggunakan tenant key <span className="mono">{created.tenantKey}</span> dan kredensial owner yang baru dibuat.</p></section>}
  </div>
}
