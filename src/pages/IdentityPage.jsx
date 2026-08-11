import { useMemo, useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { identityApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { PERMISSIONS } from '../store/permissions'

const initialUser = { username: '', email: '', password: '', roleIds: [] }

function MultiSelect({ label, options, selected, onChange, emptyText }) {
  const toggle = (value, checked) => onChange(checked ? [...selected, value] : selected.filter((item) => item !== value))
  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label)

  return <label className="field multi-select-field"><span>{label}</span><details className="multi-select">
    <summary>{selectedLabels.length ? selectedLabels.join(', ') : `Pilih ${label.toLowerCase()}`}</summary>
    <div className="multi-select__menu">
      {options.map((option) => <label key={option.value}>
        <input type="checkbox" checked={selected.includes(option.value)} onChange={(event) => toggle(option.value, event.target.checked)} />
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
      </label>)}
      {!options.length && <small>{emptyText}</small>}
    </div>
  </details></label>
}

export default function IdentityPage() {
  const { session, can } = useAuth()
  const tenantId = session.tenantId
  const canViewUsers = can(PERMISSIONS.USER_VIEW)
  const canViewRoles = can(PERMISSIONS.ROLE_VIEW)
  const canViewPermissions = can(PERMISSIONS.PERMISSION_VIEW)
  const users = useRemoteList((signal) => identityApi.users(tenantId, signal), tenantId, canViewUsers)
  const roles = useRemoteList((signal) => identityApi.roles(tenantId, signal), tenantId, canViewRoles)
  const permissions = useRemoteList((signal) => identityApi.permissions(tenantId, signal), tenantId, canViewPermissions)
  const visibleTabs = useMemo(() => [
    (canViewUsers || can(PERMISSIONS.USER_CREATE)) && 'users',
    (canViewRoles || can(PERMISSIONS.ROLE_CREATE) || can(PERMISSIONS.ROLE_EDIT)) && 'roles',
    (canViewPermissions || can(PERMISSIONS.PERMISSION_CREATE)) && 'permissions',
  ].filter(Boolean), [canViewPermissions, canViewRoles, canViewUsers, can])
  const [tab, setTab] = useState(visibleTabs[0])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(initialUser)
  const [saving, setSaving] = useState(false)
  const notice = useNotice()
  const configs = {
    users: { data: users, title: 'User baru', initial: initialUser, fields: [['username', 'Username'], ['email', 'Email', 'email'], ['password', 'Password', 'password']], create: async ({ roleIds, ...value }) => { if (!roleIds.length) throw new Error('Pilih minimal satu role.'); const user = await identityApi.createUser(tenantId, value); return identityApi.assignRoles(tenantId, user.userId, roleIds) }, columns: [{ key: 'username', label: 'User' }, { key: 'email', label: 'Email' }, { key: 'roles', label: 'Role', render: (row) => [...(row.roles || [])].join(', ') || '—' }, { key: 'enabled', label: 'Status', render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Disabled'}</Badge> }] },
    roles: { data: roles, title: 'Role baru', initial: { name: '', description: '', permissions: [] }, fields: [['name', 'Role name'], ['description', 'Description']], create: (value) => identityApi.createRole(tenantId, value), columns: [{ key: 'name', label: 'Role' }, { key: 'description', label: 'Description' }, { key: 'permissions', label: 'Permissions', render: (row) => `${row.permissions?.size ?? row.permissions?.length ?? 0} grants` }, { key: 'systemRole', label: 'Type', render: (row) => <Badge>{row.systemRole ? 'System' : 'Custom'}</Badge> }] },
    permissions: { data: permissions, title: 'Permission baru', initial: { resource: '', action: '', description: '' }, fields: [['resource', 'Resource'], ['action', 'Action'], ['description', 'Description']], create: (value) => identityApi.createPermission(tenantId, value), columns: [{ key: 'authority', label: 'Authority' }, { key: 'resource', label: 'Resource' }, { key: 'action', label: 'Action' }, { key: 'description', label: 'Description' }] },
  }
  const current = configs[tab]
  const canCreate = tab === 'users'
    ? can(PERMISSIONS.USER_CREATE) && can(PERMISSIONS.ROLE_ASSIGN) && canViewRoles
    : tab === 'roles' ? can(PERMISSIONS.ROLE_CREATE) : can(PERMISSIONS.PERMISSION_CREATE)
  const openCreate = () => { setForm(current.initial); setModal(true) }
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await current.create(form); notice.success(`${current.title} berhasil dibuat.`); setModal(false); current.data.reload() } catch (error) { notice.fail(error.message) } finally { setSaving(false) } }

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h2>Identity & access</h2><p>Kelola siapa yang dapat mengakses setiap layanan.</p></div>{canCreate && <Button onClick={openCreate}>+ Tambah {tab === 'permissions' ? 'permission' : tab.slice(0, -1)}</Button>}</section>
    <div className="stat-strip"><div><span>Tenant</span><strong>{session.tenantId?.slice(0, 8)}…</strong></div><div><span>Users</span><strong>{users.data.length}</strong></div><div><span>Roles</span><strong>{roles.data.length}</strong></div><div><span>Permissions</span><strong>{permissions.data.length}</strong></div></div>
    <Panel title="Access directory" actions={<div className="tabs" role="tablist">{visibleTabs.map((name) => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>}>
      <Status loading={current.data.loading} error={current.data.error} empty={!current.data.data.length} onRetry={current.data.reload} />
      {!current.data.loading && !current.data.error && current.data.data.length > 0 && <DataTable rows={current.data.data} columns={current.columns} rowKey={tab === 'users' ? 'userId' : tab === 'roles' ? 'roleId' : 'permissionId'} />}
    </Panel>
    <Modal title={current.title} open={modal} onClose={() => setModal(false)}><form className="form-grid" onSubmit={submit}>
      {tab === 'users' && <Field label="Tenant ID" name="tenantId" value={tenantId} readOnly hint="User akan dibuat pada tenant dari sesi login saat ini." />}
      {current.fields.map(([name, label, type = 'text', hint]) => <Field key={name} label={label} name={name} type={type} hint={hint} required={name !== 'description' && name !== 'permissions'} minLength={type === 'password' ? 12 : undefined} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />)}
      {tab === 'users' && <MultiSelect label="Roles" options={roles.data.map((role) => ({ value: role.roleId, label: role.name, description: role.description || (role.systemRole ? 'System role' : 'Custom role') }))} selected={form.roleIds || []} onChange={(roleIds) => setForm({ ...form, roleIds })} emptyText="Belum ada role yang dapat dipilih." />}
      {tab === 'roles' && <MultiSelect label="Permissions" options={permissions.data.map((permission) => ({ value: permission.authority, label: permission.authority, description: permission.description }))} selected={form.permissions || []} onChange={(selectedPermissions) => setForm({ ...form, permissions: selectedPermissions })} emptyText="Belum ada permission yang dapat dipilih." />}
      <div className="form-actions"><Button type="button" variant="ghost" onClick={() => setModal(false)}>Batal</Button><Button disabled={saving || (tab === 'users' && !(form.roleIds || []).length)}>{saving ? 'Menyimpan…' : 'Simpan'}</Button></div>
    </form></Modal>
  </div>
}
