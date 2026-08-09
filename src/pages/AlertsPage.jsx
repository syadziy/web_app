import { useState } from 'react'
import { Badge, Button, DataTable, Field, Modal, Notice, Panel, Status, useNotice } from '../components/ui'
import { alertApi } from '../services/api'

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
const emptyRecipient = { displayName: '', email: '', type: 'TO', enabled: true }

export default function AlertsPage() {
    const [tab, setTab] = useState('compose')
    const [form, setForm] = useState(createInitialMessage)
    const [recipients, setRecipients] = useState([])
    const [recipientForm, setRecipientForm] = useState(emptyRecipient)
    const [editingId, setEditingId] = useState(null)
    const [recipientModal, setRecipientModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState(null)
    const notice = useNotice()
    const activeRecipients = recipients.filter((recipient) => recipient.enabled)

    const openRecipient = (recipient) => {
        setEditingId(recipient?.id || null)
        setRecipientForm(recipient ? { displayName: recipient.displayName, email: recipient.email, type: recipient.type, enabled: recipient.enabled } : emptyRecipient)
        setRecipientModal(true)
    }
    const saveRecipient = (event) => {
        event.preventDefault()
        const normalizedEmail = recipientForm.email.trim().toLowerCase()
        const duplicate = recipients.some((recipient) => recipient.email.toLowerCase() === normalizedEmail && recipient.id !== editingId)
        if (duplicate) { notice.fail('Email tersebut sudah ada dalam konfigurasi recipient.'); return }
        if (editingId) {
            setRecipients((items) => items.map((item) => item.id === editingId ? { ...item, ...recipientForm, email: normalizedEmail } : item))
            notice.success('Konfigurasi recipient berhasil diperbarui.')
        } else {
            setRecipients((items) => [...items, { ...recipientForm, email: normalizedEmail, id: crypto.randomUUID() }])
            notice.success('Recipient berhasil ditambahkan.')
        }
        setRecipientModal(false)
    }
    const toggleRecipient = (id) => setRecipients((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
    const removeRecipient = (id) => {
        setRecipients((items) => items.filter((item) => item.id !== id))
        notice.success('Recipient dihapus dari konfigurasi sesi ini.')
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
        { key: 'type', label: 'Type', render: (row) => <Badge tone={row.type === 'TO' ? 'success' : 'neutral'}>{row.type}</Badge> },
        { key: 'enabled', label: 'Status', render: (row) => <button className={`toggle ${row.enabled ? 'toggle--active' : ''}`} role="switch" aria-checked={row.enabled} onClick={() => toggleRecipient(row.id)}><i />{row.enabled ? 'Active' : 'Inactive'}</button> },
        { key: 'actions', label: 'Actions', render: (row) => <div className="table-actions"><Button variant="ghost" onClick={() => openRecipient(row)}>Edit</Button><Button variant="ghost" onClick={() => removeRecipient(row.id)}>Hapus</Button></div> },
    ]

    return <div className="page-stack">
        <Notice notice={notice.notice} onClose={notice.clear} />
        <section className="page-heading"><div><p className="eyebrow">CENTRALIZED DELIVERY</p><h2>Alert center</h2><p>Konfigurasi recipient dan kirim pesan melalui satu jalur tepercaya.</p></div>{result && <Badge tone="success">{result.status}</Badge>}</section>
        <div className="section-tabs" role="tablist"><button role="tab" aria-selected={tab === 'compose'} onClick={() => setTab('compose')}>Compose alert</button><button role="tab" aria-selected={tab === 'recipients'} onClick={() => setTab('recipients')}>Recipient config <span>{activeRecipients.length}</span></button></div>
        {tab === 'compose' ? <div className="compose-grid">
            <Panel title="Message" eyebrow="CONTENT"><form id="alert-form" className="form-grid form-grid--two" onSubmit={submit}><Field label="Source system" name="sourceSystem" required value={form.sourceSystem} onChange={(e) => setForm({ ...form, sourceSystem: e.target.value })} /><Field as="select" options={['TEXT', 'HTML']} label="Body type" name="bodyType" value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} /><Field label="Sender email" name="senderEmail" type="email" required value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} /><Field label="Sender name" name="senderName" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /><Field label="Reply-to email" name="replyToEmail" type="email" value={form.replyToEmail} onChange={(e) => setForm({ ...form, replyToEmail: e.target.value })} /><Field label="Priority (1—9)" name="priority" type="number" min="1" max="9" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /><div className="span-two"><Field label="Subject" name="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div><div className="span-two"><Field as="textarea" label="Body" name="body" rows="9" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div></form></Panel>
            <aside className="compose-aside"><Panel title="Delivery"><dl><dt>Channel</dt><dd>Email / SMTP</dd><dt>Active recipients</dt><dd>{activeRecipients.length} configured</dd><dt>Idempotency key</dt><dd className="mono">{form.idempotencyKey.slice(0, 13)}…</dd><dt>Priority</dt><dd>{form.priority} / 9</dd></dl>{!activeRecipients.length && <button className="recipient-empty" onClick={() => setTab('recipients')}>+ Configure recipients first</button>}<Button form="alert-form" disabled={saving || !activeRecipients.length}>{saving ? 'Membuat alert…' : 'Create alert →'}</Button>{result && <Button variant="secondary" onClick={dispatch}>Dispatch sekarang</Button>}</Panel><div className="info-card"><strong>Safe delivery</strong><p>Hanya recipient berstatus aktif yang dikirimkan dalam payload melalui API Gateway.</p></div></aside>
        </div> : <Panel title="Recipient configuration" eyebrow="SESSION DIRECTORY" actions={<Button onClick={() => openRecipient()}>+ Add recipient</Button>}><div className="recipient-summary"><div><strong>{recipients.length}</strong><span>Total recipients</span></div><div><strong>{activeRecipients.length}</strong><span>Active delivery</span></div><div><strong>{recipients.filter((item) => item.type === 'CC').length}</strong><span>CC recipients</span></div><div><strong>{recipients.filter((item) => item.type === 'BCC').length}</strong><span>BCC recipients</span></div></div><Status empty={!recipients.length} />{recipients.length > 0 && <DataTable rows={recipients} columns={recipientColumns} rowKey="id" />}</Panel>}
        <Modal title={editingId ? 'Edit recipient' : 'Add recipient'} open={recipientModal} onClose={() => setRecipientModal(false)}><form className="form-grid" onSubmit={saveRecipient}><Field label="Display name" name="displayName" value={recipientForm.displayName} onChange={(e) => setRecipientForm({ ...recipientForm, displayName: e.target.value })} placeholder="Operations team" /><Field label="Email address" name="email" type="email" required value={recipientForm.email} onChange={(e) => setRecipientForm({ ...recipientForm, email: e.target.value })} placeholder="ops@example.com" /><Field as="select" label="Recipient type" name="type" options={[{ value: 'TO', label: 'TO — Primary recipient' }, { value: 'CC', label: 'CC — Carbon copy' }, { value: 'BCC', label: 'BCC — Blind carbon copy' }]} value={recipientForm.type} onChange={(e) => setRecipientForm({ ...recipientForm, type: e.target.value })} /><div className="form-actions"><Button type="button" variant="ghost" onClick={() => setRecipientModal(false)}>Batal</Button><Button>Simpan recipient</Button></div></form></Modal>
    </div>
}
