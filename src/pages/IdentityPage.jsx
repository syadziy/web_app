import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { identityApi } from '../services/api'
import { useAuth } from '../store/AuthContext'

const initialUser = { username: '', email: '', password: '', roleIds: [] }

function RolePicker({ roles, selected, onChange }) {
  return <fieldset className="role-picker"><legend>Roles</legend>
    {roles.map((role) => <label key={role.roleId}><input type="checkbox" checked={selected.includes(role.roleId)} onChange={(event) => onChange(event.target.checked ? [...selected, role.roleId] : selected.filter((id) => id !== role.roleId))} /><span><strong>{role.name}</strong><small>{role.description || (role.systemRole ? 'System role' : 'Custom role')}</small></span></label>)}
    {!roles.length && <small>Belum ada role yang dapat dipilih.</small>}
  </fieldset>
}

export default function IdentityPage() {
  const { session } = useAuth()
  const tenantId = session.tenantId
  const users = useRemoteList((signal) => identityApi.users(tenantId, signal), tenantId)
  const roles = useRemoteList((signal) => identityApi.roles(tenantId, signal), tenantId)
  const permissions = useRemoteList((signal) => identityApi.permissions(tenantId, signal), tenantId)
  const [tab, setTab] = useState('users')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(initialUser)
  const [saving, setSaving] = useState(false)
  const notice = useNotice()
  const configs = {
    users: { data: users, title: 'User baru', initial: initialUser, fields: [['username', 'Username'], ['email', 'Email', 'email'], ['password', 'Password', 'password']], create: async ({ roleIds, ...value }) => { if (!roleIds.length) throw new Error('Pilih minimal satu role.'); const user = await identityApi.createUser(tenantId, value); return identityApi.assignRoles(tenantId, user.userId, roleIds) }, columns: [{ key: 'username', label: 'User' }, { key: 'email', label: 'Email' }, { key: 'roles', label: 'Role', render: (row) => [...(row.roles || [])].join(', ') || '—' }, { key: 'enabled', label: 'Status', render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Disabled'}</Badge> }] },
    roles: { data: roles, title: 'Role baru', initial: { name: '', description: '', permissions: '' }, fields: [['name', 'Role name'], ['description', 'Description'], ['permissions', 'Permissions', 'text', 'Pisahkan authority dengan koma']], create: (value) => identityApi.createRole(tenantId, { ...value, permissions: value.permissions.split(',').map((item) => item.trim()).filter(Boolean) }), columns: [{ key: 'name', label: 'Role' }, { key: 'description', label: 'Description' }, { key: 'permissions', label: 'Permissions', render: (row) => `${row.permissions?.size ?? row.permissions?.length ?? 0} grants` }, { key: 'systemRole', label: 'Type', render: (row) => <Badge>{row.systemRole ? 'System' : 'Custom'}</Badge> }] },
    permissions: { data: permissions, title: 'Permission baru', initial: { resource: '', action: '', description: '' }, fields: [['resource', 'Resource'], ['action', 'Action'], ['description', 'Description']], create: (value) => identityApi.createPermission(tenantId, value), columns: [{ key: 'authority', label: 'Authority' }, { key: 'resource', label: 'Resource' }, { key: 'action', label: 'Action' }, { key: 'description', label: 'Description' }] },
  }
  const current = configs[tab]
  const openCreate = () => { setForm(current.initial); setModal(true) }
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await current.create(form); notice.success(`${current.title} berhasil dibuat.`); setModal(false); current.data.reload() } catch (error) { notice.fail(error.message) } finally { setSaving(false) } }

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h2>Identity & access</h2><p>Kelola siapa yang dapat mengakses setiap layanan.</p></div><Button onClick={openCreate}>+ Tambah {tab === 'permissions' ? 'permission' : tab.slice(0, -1)}</Button></section>
    <div className="stat-strip"><div><span>Tenant</span><strong>{session.tenantId?.slice(0, 8)}…</strong></div><div><span>Users</span><strong>{users.data.length}</strong></div><div><span>Roles</span><strong>{roles.data.length}</strong></div><div><span>Permissions</span><strong>{permissions.data.length}</strong></div></div>
    <Panel title="Access directory" actions={<div className="tabs" role="tablist">{Object.keys(configs).map((name) => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>}>
      <Status loading={current.data.loading} error={current.data.error} empty={!current.data.data.length} onRetry={current.data.reload} />
      {!current.data.loading && !current.data.error && current.data.data.length > 0 && <DataTable rows={current.data.data} columns={current.columns} rowKey={tab === 'users' ? 'userId' : tab === 'roles' ? 'roleId' : 'permissionId'} />}
    </Panel>
    <Modal title={current.title} open={modal} onClose={() => setModal(false)}><form className="form-grid" onSubmit={submit}>
      {current.fields.map(([name, label, type = 'text', hint]) => <Field key={name} label={label} name={name} type={type} hint={hint} required={name !== 'description' && name !== 'permissions'} minLength={type === 'password' ? 12 : undefined} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />)}
      {tab === 'users' && <RolePicker roles={roles.data} selected={form.roleIds || []} onChange={(roleIds) => setForm({ ...form, roleIds })} />}
      <div className="form-actions"><Button type="button" variant="ghost" onClick={() => setModal(false)}>Batal</Button><Button disabled={saving || (tab === 'users' && !(form.roleIds || []).length)}>{saving ? 'Menyimpan…' : 'Simpan'}</Button></div>
    </form></Modal>
  </div>
}
