import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, MultiSelect, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { schedulerApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { useLanguage } from '../store/LanguageContext'
import { PERMISSIONS } from '../store/permissions'

const defaultHistoryFilters = { date: '', from: '', to: '', groupId: '', taskId: '', thresholdExceeded: '' }
const historyParams = (filters) => Object.fromEntries(Object.entries({
  ...filters,
  from: filters.from ? new Date(filters.from).toISOString() : '',
  to: filters.to ? new Date(filters.to).toISOString() : '',
}).filter(([, value]) => value !== ''))

function HistoryFilters({ filters, onChange, onApply, onReset, t }) {
  const update = (values) => onChange({ ...filters, ...values })
  return <form className="filters filters--history" onSubmit={onApply}>
    <Field label={t('date')} name="date" type="date" value={filters.date} onChange={(event) => update({ date: event.target.value, from: '', to: '', offset: '0' })} />
    <Field label={t('fromTime')} name="from" type="datetime-local" value={filters.from} onChange={(event) => update({ from: event.target.value, date: '', offset: '0' })} />
    <Field label={t('toTime')} name="to" type="datetime-local" value={filters.to} onChange={(event) => update({ to: event.target.value, date: '', offset: '0' })} />
    <Field label={t('groupId')} name="groupId" placeholder="UUID group" value={filters.groupId} onChange={(event) => update({ groupId: event.target.value, offset: '0' })} />
    <Field label={t('taskId')} name="taskId" placeholder="UUID task" value={filters.taskId} onChange={(event) => update({ taskId: event.target.value, offset: '0' })} />
    <Field as="select" label={t('thresholdExceeded')} name="thresholdExceeded" options={[{ value: '', label: t('all') }, { value: 'true', label: t('yes') }, { value: 'false', label: t('no') }]} value={filters.thresholdExceeded} onChange={(event) => update({ thresholdExceeded: event.target.value, offset: '0' })} />
    <div className="filter-actions"><Button>{t('applyFilters')}</Button><Button type="button" variant="ghost" onClick={onReset}>{t('reset')}</Button></div>
  </form>
}

function SchedulerModal({ kind, form, setForm, saving, onClose, onSubmit, taskChoices, groupChoices, t }) {
  const title = kind === 'task' ? 'createHttpTask' : kind === 'group' ? 'createTaskGroup' : 'createSchedule'
  return <Modal open={Boolean(kind)} title={t(title)} onClose={onClose}>
    <form className="form-grid" onSubmit={onSubmit}>
      <Field label={t('name')} name="name" required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      {kind === 'task' ? <>
        <Field as="select" options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} label={t('method')} name="method" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })} />
        <Field label={t('endpointUrl')} name="endpoint" type="url" required value={form.endpoint} onChange={(event) => setForm({ ...form, endpoint: event.target.value })} />
        <Field as="textarea" label={t('requestBodyJson')} name="requestBody" rows="4" value={form.requestBody} onChange={(event) => setForm({ ...form, requestBody: event.target.value })} />
        <Field label={t('timeout')} name="timeout" hint={t('isoDuration')} value={form.timeout} onChange={(event) => setForm({ ...form, timeout: event.target.value })} />
        <Field label={t('threshold')} name="threshold" required value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} />
      </> : kind === 'group' ? <>
        <Field as="select" options={[{ value: 'SERIAL', label: t('serial') }, { value: 'PARALLEL', label: t('parallel') }]} label={t('executionMode')} name="executionMode" value={form.executionMode} onChange={(event) => setForm({ ...form, executionMode: event.target.value })} />
        <MultiSelect label={t('directTasks')} selectText={t('selectLabel', { label: t('tasks').toLowerCase() })} searchText={t('searchOptions')} noMatchesText={t('noMatchingOptions')} options={taskChoices.options} selected={form.taskIds || []} onChange={(taskIds) => setForm({ ...form, taskIds })} emptyText={taskChoices.emptyText} />
        <MultiSelect label={t('nestedGroups')} selectText={t('selectLabel', { label: t('groups').toLowerCase() })} searchText={t('searchOptions')} noMatchesText={t('noMatchingOptions')} options={groupChoices.options} selected={form.groupIds || []} onChange={(groupIds) => setForm({ ...form, groupIds })} emptyText={groupChoices.emptyText} />
        <small>{t('groupMembersHint')}</small>
      </> : <>
        <Field as="select" options={['TASK', 'GROUP']} label={t('targetType')} name="targetType" value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value })} />
        <Field label={t(form.targetType === 'TASK' ? 'taskId' : 'groupId')} name={form.targetType === 'TASK' ? 'taskId' : 'groupId'} required value={form.targetType === 'TASK' ? form.taskId : form.groupId} onChange={(event) => setForm({ ...form, [form.targetType === 'TASK' ? 'taskId' : 'groupId']: event.target.value })} />
        <Field label={t('cronExpression')} name="cronExpression" required value={form.cronExpression} onChange={(event) => setForm({ ...form, cronExpression: event.target.value })} />
        <Field label={t('timezone')} name="zoneId" required value={form.zoneId} onChange={(event) => setForm({ ...form, zoneId: event.target.value })} />
      </>}
      <div className="form-actions"><Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button><Button disabled={saving}>{t(saving ? 'saving' : 'save')}</Button></div>
    </form>
  </Modal>
}

export default function SchedulerPage() {
  const { can } = useAuth()
  const { language, t } = useLanguage()
  const formatDate = (date) => date ? new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '—'
  const canRead = can(PERMISSIONS.SCHEDULER_READ)
  const canManage = can(PERMISSIONS.SCHEDULER_MANAGE)
  const canCreateGroup = canRead && canManage
  const [tab, setTab] = useState(canRead ? 'history' : null)
  const listPagination = { defaultLimit: 10, options: [10, 50, 100, 500] }
  const tasks = useRemoteList((signal, page) => schedulerApi.tasks(page, signal), 'scheduler-tasks', canRead, listPagination)
  const groups = useRemoteList((signal, page) => schedulerApi.groups(page, signal), 'scheduler-groups', canRead, listPagination)
  const schedules = useRemoteList((signal, page) => schedulerApi.schedules(page, signal), 'scheduler-schedules', canRead, listPagination)
  const [historyFilters, setHistoryFilters] = useState(defaultHistoryFilters)
  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState(defaultHistoryFilters)
  const history = useRemoteList((signal, page) => schedulerApi.histories({ ...historyParams(appliedHistoryFilters), ...page }, signal), JSON.stringify(appliedHistoryFilters), canRead, { defaultLimit: 500, options: [500, 1000, 1500, 2000] })
  const [kind, setKind] = useState(null)
  const [saving, setSaving] = useState(false)
  const [createdTasks, setCreatedTasks] = useState([])
  const [form, setForm] = useState({})
  const taskChoices = useRemoteList((signal) => schedulerApi.tasks({ limit: 500, offset: 0 }, signal), 'scheduler-task-choices', kind === 'group' && canCreateGroup)
  const groupChoices = useRemoteList((signal) => schedulerApi.groups({ limit: 500, offset: 0 }, signal), 'scheduler-group-choices', kind === 'group' && canCreateGroup)
  const notice = useNotice()
  const open = (type) => {
    setKind(type)
    if (type === 'task') setForm({ name: '', method: 'GET', endpoint: '', requestBody: '', timeout: 'PT30S', threshold: 'PT5S', enabled: true })
    else if (type === 'group') setForm({ name: '', executionMode: 'SERIAL', taskIds: [], groupIds: [], enabled: true })
    else setForm({ name: '', targetType: 'TASK', taskId: '', groupId: '', cronExpression: '0 */5 * * * *', zoneId: 'Asia/Jakarta', enabled: true })
  }
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (kind === 'task') {
        payload.headers = {}
        if (!payload.requestBody) delete payload.requestBody
        const result = await schedulerApi.createTask(payload)
        setCreatedTasks((items) => [result, ...items])
        tasks.reload()
      } else if (kind === 'group') {
        if (!(payload.taskIds?.length || payload.groupIds?.length)) throw new Error(t('groupMemberRequired'))
        if (payload.taskIds.length + payload.groupIds.length > 100) throw new Error(t('groupMemberLimit'))
        await schedulerApi.createGroup(payload)
        groups.reload()
      } else {
        if (payload.targetType === 'TASK') delete payload.groupId
        else delete payload.taskId
        await schedulerApi.createSchedule(payload)
        schedules.reload()
      }
      const item = kind === 'task' ? t('tasks') : kind === 'group' ? t('group') : t('schedule')
      notice.success(t('itemCreated', { item }))
      setKind(null)
      history.reload()
    } catch (error) {
      notice.fail(error.message)
    } finally {
      setSaving(false)
    }
  }
  const taskChoiceState = {
    options: taskChoices.data.map((task) => ({ value: task.id || task.taskId, label: task.name, description: `${task.method} ${task.endpoint}` })),
    emptyText: taskChoices.loading ? t('loading') : taskChoices.error || t('noTasks'),
  }
  const groupChoiceState = {
    options: groupChoices.data.map((group) => ({ value: group.id || group.groupId, label: group.name, description: group.executionMode })),
    emptyText: groupChoices.loading ? t('loading') : groupChoices.error || t('noGroups'),
  }
  const historyColumns = [{ key: 'taskName', label: 'Task' }, { key: 'status', label: t('status'), render: (row) => <Badge tone={row.status === 'SUCCESS' ? 'success' : row.status === 'FAILED' ? 'error' : 'neutral'}>{row.status}</Badge> }, { key: 'startedAt', label: t('started'), render: (row) => formatDate(row.startedAt) }, { key: 'durationMs', label: t('duration'), render: (row) => `${row.durationMs} ms` }, { key: 'httpStatusCode', label: 'HTTP' }]
  const taskColumns = [{ key: 'name', label: 'Task' }, { key: 'method', label: t('method') }, { key: 'endpoint', label: t('endpoint') }, { key: 'timeout', label: t('timeout') }, { key: 'threshold', label: t('threshold') }, { key: 'enabled', label: t('status'), render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{t(row.enabled ? 'active' : 'disabled')}</Badge> }]
  const groupColumns = [{ key: 'name', label: t('group') }, { key: 'executionMode', label: t('mode') }, { key: 'tasks', label: t('tasks'), render: (row) => row.tasks?.length ?? 0 }, { key: 'groups', label: t('childGroups'), render: (row) => row.groups?.length ?? 0 }, { key: 'enabled', label: t('status'), render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{t(row.enabled ? 'active' : 'disabled')}</Badge> }]
  const scheduleColumns = [{ key: 'name', label: t('schedule') }, { key: 'targetType', label: t('target') }, { key: 'targetId', label: t('targetId'), render: (row) => row.taskId || row.groupId }, { key: 'cronExpression', label: 'Cron' }, { key: 'zoneId', label: t('timezone') }, { key: 'nextExecutionAt', label: t('nextExecution'), render: (row) => formatDate(row.nextExecutionAt) }, { key: 'enabled', label: t('status'), render: (row) => <Badge tone={row.enabled ? 'success' : 'neutral'}>{t(row.enabled ? 'active' : 'disabled')}</Badge> }]
  const resetFilters = () => { setHistoryFilters(defaultHistoryFilters); setAppliedHistoryFilters(defaultHistoryFilters) }

  return <div className="page-stack">
    <Notice notice={notice.notice} onClose={notice.clear} />
    <section className="page-heading"><div><p className="eyebrow">{t('automationEngine')}</p><h2>{t('scheduler')}</h2><p>{t('schedulerIntro')}</p></div>{canManage && <div className="button-row"><Button variant="secondary" onClick={() => open('schedule')}>+ {t('schedule')}</Button>{canCreateGroup && <Button variant="secondary" onClick={() => open('group')}>+ {t('group')}</Button>}<Button onClick={() => open('task')}>+ Task</Button></div>}</section>
    {createdTasks.length > 0 && <div className="stat-strip"><div><span>{t('lastTask')}</span><strong>{createdTasks[0].name}</strong></div><div><span>{t('taskId')}</span><strong>{createdTasks[0].taskId?.slice(0, 8)}…</strong></div></div>}
    {canRead && <div className="section-tabs" role="tablist"><button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>{t('schedulerHistory')} <span>{history.data.length}</span></button><button role="tab" aria-selected={tab === 'schedules'} onClick={() => setTab('schedules')}>{t('schedules')} <span>{schedules.data.length}</span></button><button role="tab" aria-selected={tab === 'tasks'} onClick={() => setTab('tasks')}>{t('tasks')} <span>{tasks.data.length}</span></button><button role="tab" aria-selected={tab === 'groups'} onClick={() => setTab('groups')}>{t('groups')} <span>{groups.data.length}</span></button></div>}
    {tab === 'tasks' && <Panel title={t('taskList')} eyebrow={t('configuration')} actions={<Button variant="ghost" onClick={tasks.reload}>{t('refresh')}</Button>}>
      <Status loading={tasks.loading} error={tasks.error} empty={!tasks.data.length} onRetry={tasks.reload} />
      {!tasks.loading && !tasks.error && tasks.data.length > 0 && <DataTable rows={tasks.data} columns={taskColumns} rowKey="id" pagination={tasks.pagination} />}
    </Panel>}
    {tab === 'groups' && <Panel title={t('taskGroupList')} eyebrow={t('configuration')} actions={<Button variant="ghost" onClick={groups.reload}>{t('refresh')}</Button>}>
      <Status loading={groups.loading} error={groups.error} empty={!groups.data.length} onRetry={groups.reload} />
      {!groups.loading && !groups.error && groups.data.length > 0 && <DataTable rows={groups.data} columns={groupColumns} rowKey="id" pagination={groups.pagination} />}
    </Panel>}
    {tab === 'schedules' && <Panel title={t('scheduleList')} eyebrow={t('configuration')} actions={<Button variant="ghost" onClick={schedules.reload}>{t('refresh')}</Button>}>
      <Status loading={schedules.loading} error={schedules.error} empty={!schedules.data.length} onRetry={schedules.reload} />
      {!schedules.loading && !schedules.error && schedules.data.length > 0 && <DataTable rows={schedules.data} columns={scheduleColumns} rowKey="id" pagination={schedules.pagination} />}
    </Panel>}
    {tab === 'history' && <Panel title={t('executionHistory')} eyebrow={appliedHistoryFilters.date || t('filterableHistory')} actions={<Button variant="ghost" onClick={history.reload}>{t('refresh')}</Button>}>
      <HistoryFilters filters={historyFilters} onChange={setHistoryFilters} onApply={(event) => { event.preventDefault(); setAppliedHistoryFilters({ ...historyFilters }) }} onReset={resetFilters} t={t} />
      <Status loading={history.loading} error={history.error} empty={!history.data.length} onRetry={history.reload} />
      {!history.loading && !history.error && history.data.length > 0 && <DataTable rows={history.data} columns={historyColumns} rowKey="historyId" pagination={history.pagination} />}
    </Panel>}
    {canManage && <SchedulerModal kind={kind} form={form} setForm={setForm} saving={saving} onClose={() => setKind(null)} onSubmit={submit} taskChoices={taskChoiceState} groupChoices={groupChoiceState} t={t} />}
  </div>
}
