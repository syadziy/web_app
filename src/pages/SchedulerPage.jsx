import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { schedulerApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { PERMISSIONS } from '../store/permissions'

const defaultHistoryFilters = { date: '', from: '', to: '', groupId: '', taskId: '', thresholdExceeded: '', limit: '2000', offset: '0' }
const formatDate = (date) => date ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '—'
const historyParams = (filters) => Object.fromEntries(Object.entries({
  ...filters,
  from: filters.from ? new Date(filters.from).toISOString() : '',
  to: filters.to ? new Date(filters.to).toISOString() : '',
}).filter(([, value]) => value !== ''))

function HistoryFilters({ filters, onChange, onApply, onReset }) {
  const update = (values) => onChange({ ...filters, ...values })
  return <form className="filters filters--history" onSubmit={onApply}>
    <Field label="Tanggal" name="date" type="date" value={filters.date} onChange={(event) => update({ date: event.target.value, from: '', to: '', offset: '0' })} />
    <Field label="Dari waktu" name="from" type="datetime-local" value={filters.from} onChange={(event) => update({ from: event.target.value, date: '', offset: '0' })} />
    <Field label="Sampai waktu" name="to" type="datetime-local" value={filters.to} onChange={(event) => update({ to: event.target.value, date: '', offset: '0' })} />
    <Field label="Group ID" name="groupId" placeholder="UUID group" value={filters.groupId} onChange={(event) => update({ groupId: event.target.value, offset: '0' })} />
    <Field label="Task ID" name="taskId" placeholder="UUID task" value={filters.taskId} onChange={(event) => update({ taskId: event.target.value, offset: '0' })} />
    <Field as="select" label="Threshold exceeded" name="thresholdExceeded" options={[{ value: '', label: 'Semua' }, { value: 'true', label: 'Ya' }, { value: 'false', label: 'Tidak' }]} value={filters.thresholdExceeded} onChange={(event) => update({ thresholdExceeded: event.target.value, offset: '0' })} />
    <div className="filter-actions"><Button>Apply filters</Button><Button type="button" variant="ghost" onClick={onReset}>Reset</Button></div>
  </form>
}

function SchedulerModal({ kind, form, setForm, saving, onClose, onSubmit }) {
  return <Modal open={Boolean(kind)} title={kind === 'task' ? 'Buat HTTP task' : 'Buat schedule'} onClose={onClose}>
    <form className="form-grid" onSubmit={onSubmit}>
      <Field label="Name" name="name" required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      {kind === 'task' ? <>
        <Field as="select" options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} label="Method" name="method" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })} />
        <Field label="Endpoint URL" name="endpoint" type="url" required value={form.endpoint} onChange={(event) => setForm({ ...form, endpoint: event.target.value })} />
        <Field as="textarea" label="Request body (JSON)" name="requestBody" rows="4" value={form.requestBody} onChange={(event) => setForm({ ...form, requestBody: event.target.value })} />
        <Field label="Timeout" name="timeout" hint="ISO-8601 duration" value={form.timeout} onChange={(event) => setForm({ ...form, timeout: event.target.value })} />
        <Field label="Threshold" name="threshold" required value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} />
      </> : <>
        <Field as="select" options={['TASK', 'GROUP']} label="Target type" name="targetType" value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value })} />
        <Field label={form.targetType === 'TASK' ? 'Task ID' : 'Group ID'} name={form.targetType === 'TASK' ? 'taskId' : 'groupId'} required value={form.targetType === 'TASK' ? form.taskId : form.groupId} onChange={(event) => setForm({ ...form, [form.targetType === 'TASK' ? 'taskId' : 'groupId']: event.target.value })} />
        <Field label="Cron expression" name="cronExpression" required value={form.cronExpression} onChange={(event) => setForm({ ...form, cronExpression: event.target.value })} />
        <Field label="Timezone" name="zoneId" required value={form.zoneId} onChange={(event) => setForm({ ...form, zoneId: event.target.value })} />
      </>}
      <div className="form-actions"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button></div>
    </form>
  </Modal>
}

export default function SchedulerPage() {
  const { can } = useAuth()
  const canRead = can(PERMISSIONS.SCHEDULER_READ)
  const canManage = can(PERMISSIONS.SCHEDULER_MANAGE)
  const [tab, setTab] = useState(canRead ? 'history' : null)
  const tasks = useRemoteList((signal) => schedulerApi.tasks(signal), 'scheduler-tasks', canRead)
  const groups = useRemoteList((signal) => schedulerApi.groups(signal), 'scheduler-groups', canRead)
  const schedules = useRemoteList((signal) => schedulerApi.schedules(signal), 'scheduler-schedules', canRead)
  const [historyFilters, setHistoryFilters] = useState(defaultHistoryFilters)
  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState(defaultHistoryFilters)
  const history = useRemoteList((signal) => schedulerApi.histories(historyParams(appliedHistoryFilters), signal), JSON.stringify(appliedHistoryFilters), canRead)
  const [kind, setKind] = useState(null)
  const [saving, setSaving] = useState(false)
  const [createdTasks, setCreatedTasks] = useState([])
  const [form, setForm] = useState({})
  const notice = useNotice()
  const open = (type) => { setKind(type); setForm(type === 'task' ? { name: '', method: 'GET', endpoint: '', requestBody: '', timeout: 'PT30S', threshold: 'PT5S', enabled: true } : { name: '', targetType: 'TASK', taskId: '', groupId: '', cronExpression: '0 */5 * * * *', zoneId: 'Asia/Jakarta', enabled: true }) }
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { const payload = { ...form }; if (kind === 'task') { payload.headers = {}; if (!payload.requestBody) delete payload.requestBody; const result = await schedulerApi.createTask(payload); setCreatedTasks((items) => [result, ...items]); tasks.reload() } else { if (payload.targetType === 'TASK') delete payload.groupId; else delete payload.taskId; await schedulerApi.createSchedule(payload); schedules.reload() } notice.success(`${kind === 'task' ? 'Task' : 'Schedule'} berhasil dibuat.`); setKind(null); history.reload() } catch (error) { notice.fail(error.message) } finally { setSaving(false) } }
  const historyColumns = [{ key: 'taskName', label: 'Task' }, { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'SUCCESS' ? 'success' : row.status === 'FAILED' ? 'error' : 'neutral'}>{row.status}</Badge> }, { key: 'startedAt', label: 'Started', render: (row) => formatDate(row.startedAt) }, { key: 'durationMs', label: 'Duration', render: (row) => `${row.durationMs} ms` }, { key: 'httpStatusCode', label: 'HTTP' }]
  const taskColumns = [{ key: 'name', label: 'Task' }, { key: 'method', label: 'Method' }, { key: 'endpoint', label: 'Endpoint' }, { key: 'timeout', label: 'Timeout' }, { key: 'threshold', label: 'Threshold' }, { key: 'enabled', label: 'Status', render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Disabled'}</Badge> }]
  const groupColumns = [{ key: 'name', label: 'Group' }, { key: 'executionMode', label: 'Mode' }, { key: 'tasks', label: 'Tasks', render: (row) => row.tasks?.length ?? 0 }, { key: 'groups', label: 'Child groups', render: (row) => row.groups?.length ?? 0 }, { key: 'enabled', label: 'Status', render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Disabled'}</Badge> }]
  const scheduleColumns = [{ key: 'name', label: 'Schedule' }, { key: 'targetType', label: 'Target' }, { key: 'targetId', label: 'Target ID', render: (row) => row.taskId || row.groupId }, { key: 'cronExpression', label: 'Cron' }, { key: 'zoneId', label: 'Timezone' }, { key: 'nextExecutionAt', label: 'Next execution', render: (row) => formatDate(row.nextExecutionAt) }, { key: 'enabled', label: 'Status', render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Disabled'}</Badge> }]
  const resetFilters = () => { setHistoryFilters(defaultHistoryFilters); setAppliedHistoryFilters(defaultHistoryFilters) }

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">AUTOMATION ENGINE</p><h2>Scheduler</h2><p>Orkestrasi pekerjaan HTTP dan lacak setiap eksekusi.</p></div>{canManage && <div className="button-row"><Button variant="secondary" onClick={() => open('schedule')}>+ Schedule</Button><Button onClick={() => open('task')}>+ Task</Button></div>}</section>
    {createdTasks.length > 0 && <div className="stat-strip"><div><span>Task terakhir</span><strong>{createdTasks[0].name}</strong></div><div><span>Task ID</span><strong>{createdTasks[0].taskId?.slice(0, 8)}…</strong></div></div>}
    {canRead && <div className="section-tabs" role="tablist"><button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>Scheduler history <span>{history.data.length}</span></button><button role="tab" aria-selected={tab === 'schedules'} onClick={() => setTab('schedules')}>Schedules <span>{schedules.data.length}</span></button><button role="tab" aria-selected={tab === 'tasks'} onClick={() => setTab('tasks')}>Tasks <span>{tasks.data.length}</span></button><button role="tab" aria-selected={tab === 'groups'} onClick={() => setTab('groups')}>Groups <span>{groups.data.length}</span></button></div>}
    {tab === 'tasks' && <Panel title="Task list" eyebrow="CONFIGURATION" actions={<Button variant="ghost" onClick={tasks.reload}>Refresh</Button>}>
      <Status loading={tasks.loading} error={tasks.error} empty={!tasks.data.length} onRetry={tasks.reload} />
      {!tasks.loading && !tasks.error && tasks.data.length > 0 && <DataTable rows={tasks.data} columns={taskColumns} rowKey="id" />}
    </Panel>}
    {tab === 'groups' && <Panel title="Task group list" eyebrow="CONFIGURATION" actions={<Button variant="ghost" onClick={groups.reload}>Refresh</Button>}>
      <Status loading={groups.loading} error={groups.error} empty={!groups.data.length} onRetry={groups.reload} />
      {!groups.loading && !groups.error && groups.data.length > 0 && <DataTable rows={groups.data} columns={groupColumns} rowKey="id" />}
    </Panel>}
    {tab === 'schedules' && <Panel title="Schedule list" eyebrow="CONFIGURATION" actions={<Button variant="ghost" onClick={schedules.reload}>Refresh</Button>}>
      <Status loading={schedules.loading} error={schedules.error} empty={!schedules.data.length} onRetry={schedules.reload} />
      {!schedules.loading && !schedules.error && schedules.data.length > 0 && <DataTable rows={schedules.data} columns={scheduleColumns} rowKey="id" />}
    </Panel>}
    {tab === 'history' && <Panel title="Execution history" eyebrow={appliedHistoryFilters.date || 'FILTERABLE HISTORY'} actions={<Button variant="ghost" onClick={history.reload}>Refresh</Button>}>
      <HistoryFilters filters={historyFilters} onChange={setHistoryFilters} onApply={(event) => { event.preventDefault(); setAppliedHistoryFilters({ ...historyFilters }) }} onReset={resetFilters} />
      <Status loading={history.loading} error={history.error} empty={!history.data.length} onRetry={history.reload} />
      {!history.loading && !history.error && history.data.length > 0 && <DataTable rows={history.data} columns={historyColumns} rowKey="historyId" defaultPageSize={500} pageSizeOptions={[500, 1000, 1500, 2000]} />}
    </Panel>}
    {canManage && <SchedulerModal kind={kind} form={form} setForm={setForm} saving={saving} onClose={() => setKind(null)} onSubmit={submit} />}
  </div>
}
