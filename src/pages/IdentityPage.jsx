import { useMemo, useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { identityApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { useLanguage } from '../store/LanguageContext'
import { isPlatformSuperadmin, PERMISSIONS } from '../store/permissions'

const initialUser = { username: '', email: '', password: '', roleIds: [] }

function MultiSelect({ label, options, selected, onChange, emptyText, selectText, searchText, noMatchesText }) {
  const [query, setQuery] = useState('')
  const toggle = (value, checked) => onChange(checked ? [...selected, value] : selected.filter((item) => item !== value))
  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label)
  const visibleOptions = options.filter((option) => `${option.label} ${option.description || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  return <label className="field multi-select-field"><span>{label}</span><details className="multi-select">
    <summary>{selectedLabels.length ? selectedLabels.join(', ') : selectText}</summary>
    <div className="multi-select__menu">
      {options.length > 0 && <div className="multi-select__search"><span className="material-icons" aria-hidden="true">search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchText} aria-label={searchText} /></div>}
      {visibleOptions.map((option) => <label key={option.value}>
        <input type="checkbox" checked={selected.includes(option.value)} onChange={(event) => toggle(option.value, event.target.checked)} />
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
      </label>)}
      {!options.length && <small>{emptyText}</small>}
      {options.length > 0 && !visibleOptions.length && <small>{noMatchesText}</small>}
    </div>
  </details></label>
}

export default function IdentityPage() {
  const { session, can } = useAuth()
  const { t } = useLanguage()
  const platformSuperadmin = isPlatformSuperadmin(session)
  const [tenantId, setTenantId] = useState(session.tenantId)
  const canViewUsers = can(PERMISSIONS.USER_VIEW)
  const canViewRoles = can(PERMISSIONS.ROLE_VIEW)
  const canViewPermissions = can(PERMISSIONS.PERMISSION_VIEW)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(initialUser)
  const [saving, setSaving] = useState(false)
  const pagination = { defaultLimit: 10, options: [10, 50, 100, 500] }
  const tenantDirectory = useRemoteList(
    (signal) => identityApi.tenants({ limit: 500, offset: 0 }, signal),
    'identity-tenant-directory',
    platformSuperadmin,
  )
  const users = useRemoteList((signal, page) => identityApi.users(tenantId, page, signal), tenantId, canViewUsers, pagination)
  const roles = useRemoteList((signal, page) => identityApi.roles(tenantId, page, signal), tenantId, canViewRoles, pagination)
  const permissions = useRemoteList((signal, page) => identityApi.permissions(tenantId, page, signal), tenantId, canViewPermissions, pagination)
  const visibleTabs = useMemo(() => [
    (canViewUsers || can(PERMISSIONS.USER_CREATE)) && 'users',
    (canViewRoles || can(PERMISSIONS.ROLE_CREATE) || can(PERMISSIONS.ROLE_EDIT)) && 'roles',
    (canViewPermissions || can(PERMISSIONS.PERMISSION_CREATE)) && 'permissions',
  ].filter(Boolean), [canViewPermissions, canViewRoles, canViewUsers, can])
  const [tab, setTab] = useState(visibleTabs[0])
  const roleChoices = useRemoteList((signal) => identityApi.roles(tenantId, { limit: 500, offset: 0 }, signal), tenantId, modal && tab === 'users' && canViewRoles)
  const permissionChoices = useRemoteList((signal) => identityApi.permissions(tenantId, { limit: 500, offset: 0 }, signal), tenantId, modal && tab === 'roles' && canViewPermissions)
  const notice = useNotice()
  const tenantOptions = useMemo(() => {
    const options = tenantDirectory.data.map((tenant) => ({
      value: tenant.tenantId,
      label: `${tenant.tenantName} (${tenant.tenantKey})`,
    }))
    if (!options.some((option) => option.value === session.tenantId)) {
      options.unshift({ value: session.tenantId, label: session.tenantKey })
    }
    return options
  }, [session.tenantId, session.tenantKey, tenantDirectory.data])
  const selectedTenant = tenantDirectory.data.find((tenant) => tenant.tenantId === tenantId)
  const configs = {
    users: { data: users, title: t('newUser'), item: t('user'), initial: initialUser, fields: [['username', t('username')], ['email', 'Email', 'email'], ['password', t('password'), 'password']], create: async ({ roleIds, ...value }) => { if (!roleIds.length) throw new Error(t('selectAtLeastOneRole')); const user = await identityApi.createUser(tenantId, value); return identityApi.assignRoles(tenantId, user.userId, roleIds) }, columns: [{ key: 'username', label: t('user') }, { key: 'email', label: 'Email' }, { key: 'roles', label: t('role'), render: (row) => [...(row.roles || [])].join(', ') || '—' }, { key: 'enabled', label: t('status'), render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{t(row.enabled ? 'active' : 'disabled')}</Badge> }] },
    roles: { data: roles, title: t('newRole'), item: t('role'), initial: { name: '', description: '', permissions: [] }, fields: [['name', t('roleName')], ['description', t('description')]], create: (value) => identityApi.createRole(tenantId, value), columns: [{ key: 'name', label: t('role') }, { key: 'description', label: t('description') }, { key: 'permissions', label: t('permissions'), render: (row) => `${row.permissions?.size ?? row.permissions?.length ?? 0} ${t('grants')}` }, { key: 'systemRole', label: t('type'), render: (row) => <Badge>{t(row.systemRole ? 'system' : 'custom')}</Badge> }] },
    permissions: { data: permissions, title: t('newPermission'), item: t('permission'), initial: { resource: '', action: '', description: '' }, fields: [['resource', t('resource')], ['action', t('action')], ['description', t('description')]], create: (value) => identityApi.createPermission(tenantId, value), columns: [{ key: 'authority', label: t('authority') }, { key: 'resource', label: t('resource') }, { key: 'action', label: t('action') }, { key: 'description', label: t('description') }] },
  }
  const current = configs[tab]
  const canCreate = tab === 'users'
    ? can(PERMISSIONS.USER_CREATE) && can(PERMISSIONS.ROLE_ASSIGN) && canViewRoles
    : tab === 'roles' ? can(PERMISSIONS.ROLE_CREATE) : can(PERMISSIONS.PERMISSION_CREATE)
  const openCreate = () => { setForm(current.initial); setModal(true) }
  const selectTenant = (event) => {
    const nextTenantId = event.target.value
    if (!nextTenantId || nextTenantId === tenantId) return
    users.pagination.onChange({ limit: users.pagination.limit, offset: 0 })
    roles.pagination.onChange({ limit: roles.pagination.limit, offset: 0 })
    permissions.pagination.onChange({ limit: permissions.pagination.limit, offset: 0 })
    setModal(false)
    setForm(initialUser)
    setTenantId(nextTenantId)
  }
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await current.create(form); notice.success(t('userCreated', { item: current.title })); setModal(false); current.data.reload() } catch (error) { notice.fail(error.message) } finally { setSaving(false) } }

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">{t('userManagement')}</p><h2>{t('identityAccess')}</h2><p>{t('identityIntro')}</p></div><div className="identity-heading-actions">{platformSuperadmin && <Field as="select" label={t('manageTenant')} name="identityTenant" value={tenantId} options={tenantOptions} onChange={selectTenant} disabled={tenantDirectory.loading || !tenantOptions.length} error={tenantDirectory.error} />}{canCreate && <Button onClick={openCreate}>+ {t('addItem', { item: current.item })}</Button>}</div></section>
    <div className="stat-strip"><div><span>Tenant</span><strong>{selectedTenant?.tenantKey || session.tenantKey || `${tenantId?.slice(0, 8)}…`}</strong></div><div><span>{t('users')}</span><strong>{users.paging?.total ?? users.data.length}</strong></div><div><span>{t('roles')}</span><strong>{roles.paging?.total ?? roles.data.length}</strong></div><div><span>{t('permissions')}</span><strong>{permissions.paging?.total ?? permissions.data.length}</strong></div></div>
    <Panel title={t('accessDirectory')} actions={<div className="tabs" role="tablist">{visibleTabs.map((name) => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{t(name)}</button>)}</div>}>
      <Status loading={current.data.loading} error={current.data.error} empty={!current.data.data.length} onRetry={current.data.reload} />
      {!current.data.loading && !current.data.error && current.data.data.length > 0 && <DataTable rows={current.data.data} columns={current.columns} rowKey={tab === 'users' ? 'userId' : tab === 'roles' ? 'roleId' : 'permissionId'} pagination={current.data.pagination} />}
    </Panel>
    <Modal title={current.title} open={modal} onClose={() => setModal(false)}><form className="form-grid" onSubmit={submit}>
      {tab === 'users' && <Field label={t('tenantId')} name="tenantId" value={tenantId} readOnly hint={t('userTenantHint')} />}
      {current.fields.map(([name, label, type = 'text', hint]) => <Field key={name} label={label} name={name} type={type} hint={hint} required={name !== 'description' && name !== 'permissions'} minLength={type === 'password' ? 12 : undefined} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />)}
      {tab === 'users' && <MultiSelect label={t('roles')} selectText={t('selectLabel', { label: t('roles').toLowerCase() })} searchText={t('searchOptions')} noMatchesText={t('noMatchingOptions')} options={roleChoices.data.map((role) => ({ value: role.roleId, label: role.name, description: role.description || t(role.systemRole ? 'systemRole' : 'customRole') }))} selected={form.roleIds || []} onChange={(roleIds) => setForm({ ...form, roleIds })} emptyText={t('noRoles')} />}
      {tab === 'roles' && <MultiSelect label={t('permissions')} selectText={t('selectLabel', { label: t('permissions').toLowerCase() })} searchText={t('searchOptions')} noMatchesText={t('noMatchingOptions')} options={permissionChoices.data.map((permission) => ({ value: permission.authority, label: permission.authority, description: permission.description }))} selected={form.permissions || []} onChange={(selectedPermissions) => setForm({ ...form, permissions: selectedPermissions })} emptyText={t('noPermissions')} />}
      <div className="form-actions"><Button type="button" variant="ghost" onClick={() => setModal(false)}>{t('cancel')}</Button><Button disabled={saving || (tab === 'users' && !(form.roleIds || []).length)}>{t(saving ? 'saving' : 'save')}</Button></div>
    </form></Modal>
  </div>
}
