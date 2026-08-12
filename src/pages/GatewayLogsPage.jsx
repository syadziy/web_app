import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Panel, Status } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { gatewayLogApi } from '../services/api'
import { useLanguage } from '../store/LanguageContext'
import { responseData, statusTone } from './gatewayLogs'

const EMPTY_FILTERS = { routeId: '', method: '', responseStatus: '', actor: '', path: '' }

export default function GatewayLogsPage() {
  const { language, t } = useLanguage()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [query, setQuery] = useState(EMPTY_FILTERS)
  const [selected, setSelected] = useState(null)
  const [detailError, setDetailError] = useState('')
  const formatDate = (date) => date ? new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(date)) : '—'
  const logs = useRemoteList((signal, page) => gatewayLogApi.list({
    ...Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '')),
    ...page,
  }, signal), JSON.stringify(query), true, { defaultLimit: 10, options: [10, 50, 100, 500] })
  const inspect = async (row) => {
    setSelected(row)
    setDetailError('')
    try { setSelected(responseData(await gatewayLogApi.detail(row.eventId))) } catch (error) { setDetailError(error.message) }
  }
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const columns = [
    { key: 'occurredAt', label: 'Time', render: (row) => formatDate(row.occurredAt) },
    { key: 'routeId', label: t('route') },
    { key: 'path', label: t('endpoint'), render: (row) => `${row.method} ${row.path}` },
    { key: 'actor', label: t('actor') },
    { key: 'responseStatus', label: t('responseStatus'), render: (row) => <Badge tone={statusTone(row.responseStatus)}>{row.responseStatus}</Badge> },
    { key: 'durationMs', label: t('duration'), render: (row) => `${row.durationMs} ms` },
    { key: 'eventId', label: '', render: (row) => <Button variant="ghost" onClick={() => inspect(row)}>{t('inspect')}</Button> },
  ]
  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">REQUEST OBSERVABILITY</p><h2>{t('gatewayLogs')}</h2><p>{t('gatewayLogsIntro')}</p></div><Badge>{logs.paging?.total ?? logs.data.length} requests</Badge></section>
    <Panel title={t('requestExplorer')} actions={<Button variant="ghost" onClick={logs.reload}>{t('refresh')}</Button>}>
      <form className="filters" onSubmit={(event) => { event.preventDefault(); logs.pagination.onChange({ limit: logs.pagination.limit, offset: 0 }); setQuery({ ...filters }) }}>
        <Field label={t('route')} name="routeId" placeholder="centralized-alert" value={filters.routeId} onChange={updateFilter} />
        <Field as="select" label={t('method')} name="method" options={[{ value: '', label: t('all') }, 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']} value={filters.method} onChange={updateFilter} />
        <Field label={t('responseStatus')} name="responseStatus" type="number" min="100" max="599" placeholder="200" value={filters.responseStatus} onChange={updateFilter} />
        <Field label={t('actor')} name="actor" placeholder="owner" value={filters.actor} onChange={updateFilter} />
        <Field label={t('path')} name="path" placeholder="/api/v1/alert" value={filters.path} onChange={updateFilter} />
        <Button>{t('applyFilters')}</Button>
      </form>
      <Status loading={logs.loading} error={logs.error} empty={!logs.data.length} onRetry={logs.reload} />
      {!logs.loading && !logs.error && logs.data.length > 0 && <DataTable rows={logs.data} columns={columns} rowKey="eventId" pagination={logs.pagination} />}
    </Panel>
    <Modal title={t('requestDetail')} open={Boolean(selected)} onClose={() => setSelected(null)}>
      {detailError && <p className="form-error">{detailError}</p>}
      <dl className="detail-list">{selected && Object.entries(selected).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' && value !== null ? <pre>{JSON.stringify(value, null, 2)}</pre> : String(value ?? '—')}</dd></div>)}</dl>
    </Modal>
  </div>
}
