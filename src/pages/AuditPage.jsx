import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Panel, Status } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { auditApi } from '../services/api'
import { useLanguage } from '../store/LanguageContext'

export default function AuditPage() {
  const { language, t } = useLanguage()
  const formatDate = (date) => date ? new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(date)) : '—'
  const [filters, setFilters] = useState({ sourceSystem: '', outcome: '' })
  const [query, setQuery] = useState(filters)
  const [selected, setSelected] = useState(null)
  const [detailError, setDetailError] = useState('')
  const logs = useRemoteList((signal, page) => auditApi.list({
    ...Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '')),
    ...page,
  }, signal), JSON.stringify(query), true, { defaultLimit: 10, options: [10, 50, 100, 500] })
  const inspect = async (row) => { setSelected(row); setDetailError(''); try { setSelected(await auditApi.detail(row.eventId)) } catch (error) { setDetailError(error.message) } }
  const columns = [{ key: 'occurredAt', label: 'Time', render: (row) => formatDate(row.occurredAt) }, { key: 'sourceSystem', label: 'Source' }, { key: 'action', label: 'Action' }, { key: 'actorName', label: 'Actor', render: (row) => row.actorName || row.actorId }, { key: 'outcome', label: t('outcome'), render: (row) => <Badge tone={row.outcome === 'SUCCESS' ? 'success' : 'error'}>{row.outcome}</Badge> }, { key: 'eventId', label: '', render: (row) => <Button variant="ghost" onClick={() => inspect(row)}>{t('inspect')}</Button> }]
  return <div className="page-stack"><section className="page-heading"><div><p className="eyebrow">IMMUTABLE TRAIL</p><h2>{t('auditLog')}</h2><p>{t('auditIntro')}</p></div><Badge>{logs.paging?.total ?? logs.data.length} events</Badge></section><Panel title={t('eventExplorer')} actions={<Button variant="ghost" onClick={logs.reload}>{t('refresh')}</Button>}><form className="filters" onSubmit={(event) => { event.preventDefault(); logs.pagination.onChange({ limit: logs.pagination.limit, offset: 0 }); setQuery({ ...filters }) }}><Field label={t('sourceSystem')} name="sourceSystem" placeholder="scheduler" value={filters.sourceSystem} onChange={(event) => setFilters({ ...filters, sourceSystem: event.target.value })} /><Field as="select" label={t('outcome')} name="outcome" options={[{ value: '', label: t('allOutcomes') }, 'SUCCESS', 'FAILURE']} value={filters.outcome} onChange={(event) => setFilters({ ...filters, outcome: event.target.value })} /><Button>{t('applyFilters')}</Button></form><Status loading={logs.loading} error={logs.error} empty={!logs.data.length} onRetry={logs.reload} />{!logs.loading && !logs.error && logs.data.length > 0 && <DataTable rows={logs.data} columns={columns} rowKey="eventId" pagination={logs.pagination} />}</Panel><Modal title={t('eventDetail')} open={Boolean(selected)} onClose={() => setSelected(null)}>{detailError && <p className="form-error">{detailError}</p>}<dl className="detail-list">{selected && Object.entries(selected).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? <pre>{JSON.stringify(value, null, 2)}</pre> : String(value ?? '—')}</dd></div>)}</dl></Modal></div>
}
