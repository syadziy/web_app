import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { alertApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { useLanguage } from '../store/LanguageContext'
import { PERMISSIONS } from '../store/permissions'

const createInitialMessage = () => ({
    sourceSystem: 'operations-ui',
    idempotencyKey: crypto.randomUUID(),
    correlationId: '',
    senderEmail: '',
    senderName: '',
    replyToEmail: '',
    subject: '',
    body: '',
    bodyType: 'TEXT',
    priority: 5,
})
const emptyRecipient = { sourceSystem: '*', displayName: '', email: '', type: 'TO', enabled: true }

export default function AlertsPage() {
    const { can } = useAuth()
    const { language, t } = useLanguage()
    const formatDate = (value) => value ? new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
    const canReadHistory = can(PERMISSIONS.ALERT_READ_NOTIFICATIONS)
    const canWrite = can(PERMISSIONS.ALERT_WRITE)
    const canReadRecipients = can(PERMISSIONS.ALERT_READ_RECIPIENTS)
    const canManageRecipients = can(PERMISSIONS.ALERT_MANAGE_RECIPIENTS)
    const [tab, setTab] = useState(canReadHistory ? 'history' : canWrite ? 'compose' : 'recipients')
    const [form, setForm] = useState(createInitialMessage)
    const recipients = useRemoteList((signal, page) => alertApi.recipients(page, signal), 'alert-recipients', canReadRecipients, { defaultLimit: 10, options: [10, 50, 100, 500] })
    const recipientDirectory = useRemoteList((signal) => alertApi.recipients({ limit: 500, offset: 0 }, signal), 'alert-recipient-directory', canReadRecipients)
    const [historyResult, setHistoryResult] = useState('')
    const deliveryHistory = useRemoteList((signal, page) => alertApi.deliveryHistory({ ...(historyResult ? { result: historyResult } : {}), ...page }, signal), historyResult, canReadHistory, { defaultLimit: 10, options: [10, 50, 100, 500] })
    const [recipientForm, setRecipientForm] = useState(emptyRecipient)
    const [editingId, setEditingId] = useState(null)
    const [recipientModal, setRecipientModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState(null)
    const notice = useNotice()
    const activeRecipients = recipientDirectory.data.filter((recipient) => recipient.enabled
        && (recipient.sourceSystem === '*' || recipient.sourceSystem === form.sourceSystem.trim().toUpperCase()))

    const openRecipient = (recipient) => {
        setEditingId(recipient?.id || null)
        setRecipientForm(recipient ? { sourceSystem: recipient.sourceSystem, displayName: recipient.displayName, email: recipient.email, type: recipient.type, enabled: recipient.enabled } : emptyRecipient)
        setRecipientModal(true)
    }
    const saveRecipient = async (event) => {
        event.preventDefault()
        const normalizedEmail = recipientForm.email.trim().toLowerCase()
        const duplicate = recipientDirectory.data.some((recipient) => recipient.sourceSystem === recipientForm.sourceSystem && recipient.type === recipientForm.type && recipient.email.toLowerCase() === normalizedEmail && recipient.id !== editingId)
        if (duplicate) { notice.fail(t('duplicateRecipient')); return }
        setSaving(true)
        try {
            const payload = { ...recipientForm, sourceSystem: recipientForm.sourceSystem.trim() || '*', email: normalizedEmail }
            if (editingId) { await alertApi.updateRecipient(editingId, payload); notice.success(t('recipientUpdated')) }
            else { await alertApi.createRecipient(payload); notice.success(t('recipientAdded')) }
            setRecipientModal(false)
            recipients.reload()
            recipientDirectory.reload()
        } catch (error) { notice.fail(error.message) } finally { setSaving(false) }
    }
    const toggleRecipient = async (recipient) => {
        try { await alertApi.updateRecipient(recipient.id, { sourceSystem: recipient.sourceSystem, type: recipient.type, email: recipient.email, displayName: recipient.displayName, enabled: !recipient.enabled }); recipients.reload(); recipientDirectory.reload() }
        catch (error) { notice.fail(error.message) }
    }
    const removeRecipient = async (id) => {
        try { await alertApi.deleteRecipient(id); recipients.reload(); recipientDirectory.reload(); notice.success(t('recipientDeleted')) }
        catch (error) { notice.fail(error.message) }
    }
    const submit = async (event) => {
        event.preventDefault()
        if (!activeRecipients.length) { notice.fail(t('recipientRequired')); setTab('recipients'); return }
        setSaving(true)
        try {
            const payload = {
                ...form,
                priority: Number(form.priority),
                recipients: activeRecipients.map(({ type, email, displayName }) => ({ type, email, displayName })),
                attachments: [],
                templateVariables: {},
            }
            const data = await alertApi.create(payload)
            setResult(data)
            setForm((current) => ({ ...current, idempotencyKey: crypto.randomUUID() }))
            notice.success(t('alertCreated', { count: activeRecipients.length }))
        } catch (error) { notice.fail(error.message) } finally { setSaving(false) }
    }
    const dispatch = async () => {
        try { await alertApi.dispatch(result.alertId); notice.success(t('dispatchAccepted')) }
        catch (error) { notice.fail(error.message) }
    }
    const recipientColumns = [
        { key: 'displayName', label: t('recipient'), render: (row) => <div className="recipient-name"><strong>{row.displayName || t('unnamed')}</strong><small>{row.email}</small></div> },
        { key: 'sourceSystem', label: t('source'), render: (row) => <span className="mono">{row.sourceSystem}</span> },
        { key: 'type', label: t('type'), render: (row) => <Badge tone={row.type === 'TO' ? 'success' : 'neutral'}>{row.type}</Badge> },
        { key: 'enabled', label: t('status'), render: (row) => canManageRecipients ? <button className={`toggle ${row.enabled ? 'toggle--active' : ''}`} role="switch" aria-checked={row.enabled} onClick={() => toggleRecipient(row)}><i />{t(row.enabled ? 'active' : 'inactive')}</button> : <Badge tone={row.enabled ? 'success' : 'neutral'}>{t(row.enabled ? 'active' : 'inactive')}</Badge> },
        ...(canManageRecipients ? [{ key: 'actions', label: t('actions'), render: (row) => <div className="table-actions"><Button variant="ghost" onClick={() => openRecipient(row)}>{t('edit')}</Button><Button variant="ghost" onClick={() => removeRecipient(row.id)}>{t('delete')}</Button></div> }] : []),
    ]
    const historyColumns = [
        { key: 'completedAt', label: t('completed'), render: (row) => formatDate(row.completedAt) },
        { key: 'subject', label: 'Email', render: (row) => <div className="recipient-name"><strong>{row.subject}</strong><small>{row.sourceSystem}</small></div> },
        { key: 'recipients', label: t('recipients') },
        { key: 'attemptNo', label: t('attempt') },
        { key: 'result', label: t('result'), render: (row) => <Badge tone={row.result === 'SUCCESS' ? 'success' : 'error'}>{row.result}</Badge> },
        { key: 'durationMs', label: t('duration'), render: (row) => `${row.durationMs} ms` },
        { key: 'providerMessageId', label: t('providerId') },
        { key: 'errorMessage', label: t('error'), render: (row) => row.errorMessage || '—' },
    ]

    return <div className="page-stack">
        <Notice notice={notice.notice} onClose={notice.clear} />
        <section className="page-heading"><div><p className="eyebrow">{t('centralizedDelivery')}</p><h2>{t('alertCenter')}</h2><p>{t('alertIntro')}</p></div>{result && <Badge tone="success">{result.status}</Badge>}</section>
        <div className="section-tabs" role="tablist">{canReadHistory && <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>{t('emailHistory')} <span>{deliveryHistory.paging?.total ?? deliveryHistory.data.length}</span></button>}{canWrite && <button role="tab" aria-selected={tab === 'compose'} onClick={() => setTab('compose')}>{t('composeAlert')}</button>}{(canReadRecipients || canManageRecipients) && <button role="tab" aria-selected={tab === 'recipients'} onClick={() => setTab('recipients')}>{t('recipientConfig')} <span>{activeRecipients.length}</span></button>}</div>
        {tab === 'compose' ? <div className="compose-grid">
            <Panel title={t('message')} eyebrow={t('content')}><form id="alert-form" className="form-grid form-grid--two" onSubmit={submit}><Field label={t('sourceSystem')} name="sourceSystem" required value={form.sourceSystem} onChange={(e) => setForm({ ...form, sourceSystem: e.target.value })} /><Field as="select" options={['TEXT', 'HTML']} label={t('bodyType')} name="bodyType" value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} /><Field label={t('senderEmail')} name="senderEmail" type="email" required value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} /><Field label={t('senderName')} name="senderName" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /><Field label={t('replyToEmail')} name="replyToEmail" type="email" value={form.replyToEmail} onChange={(e) => setForm({ ...form, replyToEmail: e.target.value })} /><Field label={t('priorityRange')} name="priority" type="number" min="1" max="9" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /><div className="span-two"><Field label={t('subject')} name="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div><div className="span-two"><Field as="textarea" label={t('body')} name="body" rows="9" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div></form></Panel>
            <aside className="compose-aside"><Panel title={t('delivery')}><dl><dt>{t('channel')}</dt><dd>Email / SMTP</dd><dt>{t('activeRecipients')}</dt><dd>{activeRecipients.length} {t('configured')}</dd><dt>{t('idempotencyKey')}</dt><dd className="mono">{form.idempotencyKey.slice(0, 13)}…</dd><dt>{t('priority')}</dt><dd>{form.priority} / 9</dd></dl>{!activeRecipients.length && (canReadRecipients || canManageRecipients) && <button className="recipient-empty" onClick={() => setTab('recipients')}>+ {t('configureRecipients')}</button>}<Button form="alert-form" disabled={saving || !activeRecipients.length}>{t(saving ? 'creatingAlert' : 'createAlert')}</Button>{result && <Button variant="secondary" onClick={dispatch}>{t('dispatchNow')}</Button>}</Panel><div className="info-card"><strong>{t('safeDelivery')}</strong><p>{t('safeDeliveryText')}</p></div></aside>
        </div> : tab === 'recipients' ? <Panel title={t('recipientConfig')} eyebrow={t('databaseDirectory')} actions={canManageRecipients && <Button onClick={() => openRecipient()}>+ {t('addRecipient')}</Button>}><div className="recipient-summary"><div><strong>{recipients.paging?.total ?? recipients.data.length}</strong><span>{t('totalRecipients')}</span></div><div><strong>{activeRecipients.length}</strong><span>{t('activeDelivery')}</span></div><div><strong>{recipientDirectory.data.filter((item) => item.type === 'CC').length}</strong><span>{t('ccRecipients')}</span></div><div><strong>{recipientDirectory.data.filter((item) => item.type === 'BCC').length}</strong><span>{t('bccRecipients')}</span></div></div>{canReadRecipients && <><Status loading={recipients.loading} error={recipients.error} empty={!recipients.data.length} onRetry={recipients.reload} />{!recipients.loading && !recipients.error && recipients.data.length > 0 && <DataTable rows={recipients.data} columns={recipientColumns} rowKey="id" pagination={recipients.pagination} />}</>}</Panel> : <Panel title={t('deliveryHistory')} eyebrow={t('deliveryAttempts')} actions={<Button variant="ghost" onClick={deliveryHistory.reload}>{t('refresh')}</Button>}><div className="filters"><Field as="select" label={t('result')} name="result" options={[{ value: '', label: t('all') }, { value: 'SUCCESS', label: t('success') }, { value: 'FAILED', label: t('failed') }]} value={historyResult} onChange={(event) => setHistoryResult(event.target.value)} /></div><Status loading={deliveryHistory.loading} error={deliveryHistory.error} empty={!deliveryHistory.data.length} onRetry={deliveryHistory.reload} />{!deliveryHistory.loading && !deliveryHistory.error && deliveryHistory.data.length > 0 && <DataTable rows={deliveryHistory.data} columns={historyColumns} rowKey="id" pagination={deliveryHistory.pagination} />}</Panel>}
        {canManageRecipients && <Modal title={t(editingId ? 'editRecipient' : 'addRecipient')} open={recipientModal} onClose={() => setRecipientModal(false)}><form className="form-grid" onSubmit={saveRecipient}><Field label={t('sourceSystem')} name="sourceSystem" required value={recipientForm.sourceSystem} onChange={(e) => setRecipientForm({ ...recipientForm, sourceSystem: e.target.value })} hint={t('useWildcard')} placeholder="*" /><Field label={t('displayName')} name="displayName" value={recipientForm.displayName} onChange={(e) => setRecipientForm({ ...recipientForm, displayName: e.target.value })} placeholder="Operations team" /><Field label={t('emailAddress')} name="email" type="email" required value={recipientForm.email} onChange={(e) => setRecipientForm({ ...recipientForm, email: e.target.value })} placeholder="ops@example.com" /><Field as="select" label={t('recipientType')} name="type" options={[{ value: 'TO', label: `TO - ${t('primaryRecipient')}` }, { value: 'CC', label: `CC - ${t('carbonCopy')}` }, { value: 'BCC', label: `BCC - ${t('blindCarbonCopy')}` }]} value={recipientForm.type} onChange={(e) => setRecipientForm({ ...recipientForm, type: e.target.value })} /><div className="form-actions"><Button type="button" variant="ghost" onClick={() => setRecipientModal(false)}>{t('cancel')}</Button><Button disabled={saving}>{t(saving ? 'saving' : 'saveRecipient')}</Button></div></form></Modal>}
    </div>
}
