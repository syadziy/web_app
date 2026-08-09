import { useState } from 'react'
import { useAlertNotifications } from '../hooks/useAlertNotifications'

const connectionLabel = {
  connected: 'Realtime connected',
  connecting: 'Connecting realtime',
  disconnected: 'Realtime disconnected',
  error: 'Realtime unavailable',
}

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}

export function NotificationPanel({ notifications, unread, connectionState, open, onToggle, onClear }) {
  return <div className="realtime-notifications">
    <button className="notification-trigger" onClick={onToggle} aria-label="Realtime notifications" aria-expanded={open}>
      <span aria-hidden="true">♢</span>
      {unread > 0 && <strong>{unread > 99 ? '99+' : unread}</strong>}
    </button>
    {open && <section className="notification-panel" aria-label="Realtime notification list">
      <header><div><span className={`connection-dot connection-dot--${connectionState}`} /><small>{connectionLabel[connectionState]}</small><h2>Notifications</h2></div>{notifications.length > 0 && <button onClick={onClear}>Clear</button>}</header>
      <div className="notification-list">
        {!notifications.length && <p>No realtime alerts yet.</p>}
        {notifications.map((item) => <article key={item.alertId}>
          <div><strong>{item.subject || 'New alert'}</strong><span className={`priority priority--${item.priority >= 7 ? 'high' : 'normal'}`}>P{item.priority}</span></div>
          <p>{item.sourceSystem} · {item.status}</p>
          <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
        </article>)}
      </div>
    </section>}
  </div>
}

export default function RealtimeNotifications({ token }) {
  const [open, setOpen] = useState(false)
  const realtime = useAlertNotifications(token)
  const toggle = () => {
    setOpen((value) => !value)
    if (!open) realtime.markAllRead()
  }
  return <NotificationPanel {...realtime} open={open} onToggle={toggle} onClear={realtime.clear} />
}
