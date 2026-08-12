import { useState } from 'react'
import { Badge, Button, DataTable, Field, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { identityApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { useLanguage } from '../store/LanguageContext'

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
  const { language, t } = useLanguage()
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
      notice.success(t('tenantCreated', { tenant: tenant.tenantKey || form.tenantKey }))
    } catch (error) {
      notice.fail(error.message)
    } finally {
      setSaving(false)
    }
  }

  const tenantColumns = [
    { key: 'tenantName', label: 'Tenant', render: (row) => <div className="tenant-name"><strong>{row.tenantName}</strong><small>{row.tenantKey}</small></div> },
    { key: 'tenantId', label: t('tenantId'), render: (row) => <span className="mono">{row.tenantId}</span> },
    { key: 'accessTokenTtlSeconds', label: t('tokenTtl'), render: (row) => `${Math.round(row.accessTokenTtlSeconds / 60)} ${t('minutes')}` },
    { key: 'createdAt', label: t('created'), render: (row) => row.createdAt ? new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.createdAt)) : '—' },
    { key: 'enabled', label: t('status'), render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{t(row.enabled ? 'active' : 'disabled')}</Badge> },
  ]

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">{t('userManagement')}</p><h2>{t('tenantManagement')}</h2><p>{t('tenantIntro')}</p></div></section>
    {canListTenants && <div className="section-tabs" role="tablist"><button role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>{t('tenantList')} <span>{tenants.data.length}</span></button><button role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}>{t('registerTenant')}</button></div>}
    {tab === 'list' && canListTenants ? <Panel title={t('tenantDirectory')} eyebrow={t('authorizedTenants')} actions={<Button variant="ghost" onClick={tenants.reload}>{t('refresh')}</Button>}>
      <Status loading={tenants.loading} error={tenants.error} empty={!tenants.data.length} onRetry={tenants.reload} />
      {!tenants.loading && !tenants.error && tenants.data.length > 0 && <DataTable rows={tenants.data} columns={tenantColumns} rowKey="tenantId" pagination={tenants.pagination} />}
    </Panel> : <div className="tenant-onboarding">
      <Panel title={t('newTenant')} eyebrow={t('onboarding')} className="tenant-form-panel">
        <form className="tenant-form" onSubmit={submit}>
          <fieldset><legend>{t('tenantInformation')}</legend><div className="form-grid form-grid--two">
            <Field label={t('tenantKey')} name="tenantKey" required pattern="[a-z0-9][a-z0-9-]{2,63}" maxLength="64" value={form.tenantKey} onChange={update} placeholder="syadziy-company" hint={t('lowercaseHint')} />
            <Field label={t('tenantName')} name="tenantName" required maxLength="150" value={form.tenantName} onChange={update} placeholder="Syadziy Company" hint={t('minimumCharacters', { count: 3 })} />
            <Field label={t('tokenLifetime')} name="accessTokenTtlSeconds" as="select" required value={form.accessTokenTtlSeconds} onChange={update} options={[{ value: '900', label: `15 ${t('minutes')}` }, { value: '1800', label: `30 ${t('minutes')}` }, { value: '3600', label: `1 ${t('hour')}` }, { value: '28800', label: `8 ${t('hours')}` }, { value: '86400', label: `24 ${t('hours')}` }]} />
          </div></fieldset>
          <fieldset><legend>{t('ownerAccount')}</legend><div className="form-grid form-grid--two">
            <Field label={t('ownerUsername')} name="ownerUsername" required pattern="[A-Za-z0-9._-]{3,80}" value={form.ownerUsername} onChange={update} placeholder="tenant.owner" />
            <Field label={t('ownerEmail')} name="ownerEmail" type="email" required maxLength="254" value={form.ownerEmail} onChange={update} placeholder="owner@company.com" />
            <Field label={t('ownerPassword')} name="ownerPassword" type="password" required minLength="12" maxLength="72" value={form.ownerPassword} onChange={update} autoComplete="new-password" hint={t('minimumCharacters', { count: 12 })} />
          </div></fieldset>
          <div className="tenant-form__footer"><p>{t('ownerSuperadmin')}</p><Button disabled={saving}>{t(saving ? 'registering' : 'register')}</Button></div>
        </form>
      </Panel>
      <aside className="tenant-guidance"><p className="eyebrow">{t('whatHappensNext')}</p><h3>{t('readyOneStep')}</h3><ol><li>{t('tenantPolicyCreated')}</li><li>{t('standardPermissionsReady')}</li><li>{t('ownerGetsAccess')}</li></ol></aside>
    </div>}
    {created && <section className="info-card tenant-created"><strong>{t('tenantReady')}</strong><p>{t('tenantLoginHint', { tenant: created.tenantKey })}</p></section>}
  </div>
}
