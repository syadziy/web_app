import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { useRemoteList } from '../hooks/useRemoteList'
import { alertApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
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
const formatDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

export default function AlertsPage() {
    const { can } = useAuth()
    const canReadHistory = can(PERMISSIONS.ALERT_READ_NOTIFICATIONS)
    const canWrite = can(PERMISSIONS.ALERT_WRITE)
    const canReadRecipients = can(PERMISSIONS.ALERT_READ_RECIPIENTS)
    const canManageRecipients = can(PERMISSIONS.ALERT_MANAGE_RECIPIENTS)
    const [tab, setTab] = useState(canReadHistory ? 'history' : canWrite ? 'compose' : 'recipients')
    const [form, setForm] = useState(createInitialMessage)
    const recipients = useRemoteList((signal, page) => alertApi.recipients(page, signal), 'alert-recipients', canReadRecipients, { defaultLimit: 10, options: [10, 50, 100, 500] })
    const [historyResult, setHistoryResult] = useState('')
    const deliveryHistory = useRemoteList((signal, page) => alertApi.deliveryHistory({ ...(historyResult ? { result: historyResult } : {}), ...page }, signal), historyResult, canReadHistory, { defaultLimit: 10, options: [10, 50, 100, 500] })
    const [recipientForm, setRecipientForm] = useState(emptyRecipient)
    const [editingId, setEditingId] = useState(null)
    const [recipientModal, setRecipientModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState(null)
    const notice = useNotice()
    const activeRecipients = recipients.data.filter((recipient) => recipient.enabled
        && (recipient.sourceSystem === '*' || recipient.sourceSystem === form.sourceSystem.trim().toUpperCase()))

    const openRecipient = (recipient) => {
        setEditingId(recipient?.id || null)
        setRecipientForm(recipient ? { sourceSystem: recipient.sourceSystem, displayName: recipient.displayName, email: recipient.email, type: recipient.type, enabled: recipient.enabled } : emptyRecipient)
        setRecipientModal(true)
    }
    const saveRecipient = async (event) => {
        event.preventDefault()
        const normalizedEmail = recipientForm.email.trim().toLowerCase()
        const duplicate = recipients.data.some((recipient) => recipient.sourceSystem === recipientForm.sourceSystem && recipient.type === recipientForm.type && recipient.email.toLowerCase() === normalizedEmail && recipient.id !== editingId)
        if (duplicate) { notice.fail('Email tersebut sudah ada dalam konfigurasi recipient.'); return }
        setSaving(true)
        try {
            const payload = { ...recipientForm, sourceSystem: recipientForm.sourceSystem.trim() || '*', email: normalizedEmail }
            if (editingId) { await alertApi.updateRecipient(editingId, payload); notice.success('Konfigurasi recipient berhasil diperbarui.') }
            else { await alertApi.createRecipient(payload); notice.success('Recipient berhasil ditambahkan.') }
            setRecipientModal(false)
            recipients.reload()
        } catch (error) { notice.fail(error.message) } finally { setSaving(false) }
    }
    const toggleRecipient = async (recipient) => {
        try { await alertApi.updateRecipient(recipient.id, { sourceSystem: recipient.sourceSystem, type: recipient.type, email: recipient.email, displayName: recipient.displayName, enabled: !recipient.enabled }); recipients.reload() }
        catch (error) { notice.fail(error.message) }
    }
    const removeRecipient = async (id) => {
        try { await alertApi.deleteRecipient(id); recipients.reload(); notice.success('Recipient dihapus dari konfigurasi database.') }
        catch (error) { notice.fail(error.message) }
    }
    const submit = async (event) => {
        event.preventDefault()
        if (!activeRecipients.length) { notice.fail('Aktifkan minimal satu recipient sebelum membuat alert.'); setTab('recipients'); return }
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
            notice.success(`Alert berhasil dibuat untuk ${activeRecipients.length} recipient.`)
        } catch (error) { notice.fail(error.message) } finally { setSaving(false) }
    }
    const dispatch = async () => {
        try { await alertApi.dispatch(result.alertId); notice.success('Dispatch alert diterima oleh service.') }
        catch (error) { notice.fail(error.message) }
    }
    const recipientColumns = [
        { key: 'displayName', label: 'Recipient', render: (row) => <div className="recipient-name"><strong>{row.displayName || 'Tanpa nama'}</strong><small>{row.email}</small></div> },
        { key: 'sourceSystem', label: 'Source', render: (row) => <span className="mono">{row.sourceSystem}</span> },
        { key: 'type', label: 'Type', render: (row) => <Badge tone={row.type === 'TO' ? 'success' : 'neutral'}>{row.type}</Badge> },
        { key: 'enabled', label: 'Status', render: (row) => canManageRecipients ? <button className={`toggle ${row.enabled ? 'toggle--active' : ''}`} role="switch" aria-checked={row.enabled} onClick={() => toggleRecipient(row)}><i />{row.enabled ? 'Active' : 'Inactive'}</button> : <Badge tone={row.enabled ? 'success' : 'neutral'}>{row.enabled ? 'Active' : 'Inactive'}</Badge> },
        ...(canManageRecipients ? [{ key: 'actions', label: 'Actions', render: (row) => <div className="table-actions"><Button variant="ghost" onClick={() => openRecipient(row)}>Edit</Button><Button variant="ghost" onClick={() => removeRecipient(row.id)}>Hapus</Button></div> }] : []),
    ]
    const historyColumns = [
        { key: 'completedAt', label: 'Completed', render: (row) => formatDate(row.completedAt) },
        { key: 'subject', label: 'Email', render: (row) => <div className="recipient-name"><strong>{row.subject}</strong><small>{row.sourceSystem}</small></div> },
        { key: 'recipients', label: 'Recipients' },
        { key: 'attemptNo', label: 'Attempt' },
        { key: 'result', label: 'Result', render: (row) => <Badge tone={row.result === 'SUCCESS' ? 'success' : 'error'}>{row.result}</Badge> },
        { key: 'durationMs', label: 'Duration', render: (row) => `${row.durationMs} ms` },
        { key: 'providerMessageId', label: 'Provider ID' },
        { key: 'errorMessage', label: 'Error', render: (row) => row.errorMessage || '—' },
    ]

    return <div className="page-stack">
        <Notice notice={notice.notice} onClose={notice.clear} />
        <section className="page-heading"><div><p className="eyebrow">CENTRALIZED DELIVERY</p><h2>Alert center</h2><p>Konfigurasi recipient dan kirim pesan melalui satu jalur tepercaya.</p></div>{result && <Badge tone="success">{result.status}</Badge>}</section>
        <div className="section-tabs" role="tablist">{canReadHistory && <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>Email history <span>{deliveryHistory.data.length}</span></button>}{canWrite && <button role="tab" aria-selected={tab === 'compose'} onClick={() => setTab('compose')}>Compose alert</button>}{(canReadRecipients || canManageRecipients) && <button role="tab" aria-selected={tab === 'recipients'} onClick={() => setTab('recipients')}>Recipient config <span>{activeRecipients.length}</span></button>}</div>
        {tab === 'compose' ? <div className="compose-grid">
            <Panel title="Message" eyebrow="CONTENT"><form id="alert-form" className="form-grid form-grid--two" onSubmit={submit}><Field label="Source system" name="sourceSystem" required value={form.sourceSystem} onChange={(e) => setForm({ ...form, sourceSystem: e.target.value })} /><Field as="select" options={['TEXT', 'HTML']} label="Body type" name="bodyType" value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} /><Field label="Sender email" name="senderEmail" type="email" required value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} /><Field label="Sender name" name="senderName" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /><Field label="Reply-to email" name="replyToEmail" type="email" value={form.replyToEmail} onChange={(e) => setForm({ ...form, replyToEmail: e.target.value })} /><Field label="Priority (1—9)" name="priority" type="number" min="1" max="9" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /><div className="span-two"><Field label="Subject" name="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div><div className="span-two"><Field as="textarea" label="Body" name="body" rows="9" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div></form></Panel>
            <aside className="compose-aside"><Panel title="Delivery"><dl><dt>Channel</dt><dd>Email / SMTP</dd><dt>Active recipients</dt><dd>{activeRecipients.length} configured</dd><dt>Idempotency key</dt><dd className="mono">{form.idempotencyKey.slice(0, 13)}…</dd><dt>Priority</dt><dd>{form.priority} / 9</dd></dl>{!activeRecipients.length && (canReadRecipients || canManageRecipients) && <button className="recipient-empty" onClick={() => setTab('recipients')}>+ Configure recipients first</button>}<Button form="alert-form" disabled={saving || !activeRecipients.length}>{saving ? 'Membuat alert…' : 'Create alert →'}</Button>{result && <Button variant="secondary" onClick={dispatch}>Dispatch sekarang</Button>}</Panel><div className="info-card"><strong>Safe delivery</strong><p>Hanya recipient berstatus aktif yang dikirimkan dalam payload melalui API Gateway.</p></div></aside>
        </div> : tab === 'recipients' ? <Panel title="Recipient configuration" eyebrow="DATABASE DIRECTORY" actions={canManageRecipients && <Button onClick={() => openRecipient()}>+ Add recipient</Button>}><div className="recipient-summary"><div><strong>{recipients.data.length}</strong><span>Total recipients</span></div><div><strong>{activeRecipients.length}</strong><span>Active delivery</span></div><div><strong>{recipients.data.filter((item) => item.type === 'CC').length}</strong><span>CC recipients</span></div><div><strong>{recipients.data.filter((item) => item.type === 'BCC').length}</strong><span>BCC recipients</span></div></div>{canReadRecipients && <><Status loading={recipients.loading} error={recipients.error} empty={!recipients.data.length} onRetry={recipients.reload} />{!recipients.loading && !recipients.error && recipients.data.length > 0 && <DataTable rows={recipients.data} columns={recipientColumns} rowKey="id" pagination={recipients.pagination} />}</>}</Panel> : <Panel title="Email delivery history" eyebrow="DELIVERY ATTEMPTS" actions={<Button variant="ghost" onClick={deliveryHistory.reload}>Refresh</Button>}><div className="filters"><Field as="select" label="Result" name="result" options={[{ value: '', label: 'Semua' }, { value: 'SUCCESS', label: 'Success' }, { value: 'FAILED', label: 'Failed' }]} value={historyResult} onChange={(event) => setHistoryResult(event.target.value)} /></div><Status loading={deliveryHistory.loading} error={deliveryHistory.error} empty={!deliveryHistory.data.length} onRetry={deliveryHistory.reload} />{!deliveryHistory.loading && !deliveryHistory.error && deliveryHistory.data.length > 0 && <DataTable rows={deliveryHistory.data} columns={historyColumns} rowKey="id" pagination={deliveryHistory.pagination} />}</Panel>}
        {canManageRecipients && <Modal title={editingId ? 'Edit recipient' : 'Add recipient'} open={recipientModal} onClose={() => setRecipientModal(false)}><form className="form-grid" onSubmit={saveRecipient}><Field label="Source system" name="sourceSystem" required value={recipientForm.sourceSystem} onChange={(e) => setRecipientForm({ ...recipientForm, sourceSystem: e.target.value })} hint="Gunakan * untuk konfigurasi global" placeholder="*" /><Field label="Display name" name="displayName" value={recipientForm.displayName} onChange={(e) => setRecipientForm({ ...recipientForm, displayName: e.target.value })} placeholder="Operations team" /><Field label="Email address" name="email" type="email" required value={recipientForm.email} onChange={(e) => setRecipientForm({ ...recipientForm, email: e.target.value })} placeholder="ops@example.com" /><Field as="select" label="Recipient type" name="type" options={[{ value: 'TO', label: 'TO — Primary recipient' }, { value: 'CC', label: 'CC — Carbon copy' }, { value: 'BCC', label: 'BCC — Blind carbon copy' }]} value={recipientForm.type} onChange={(e) => setRecipientForm({ ...recipientForm, type: e.target.value })} /><div className="form-actions"><Button type="button" variant="ghost" onClick={() => setRecipientModal(false)}>Batal</Button><Button disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan recipient'}</Button></div></form></Modal>}
    </div>
}
