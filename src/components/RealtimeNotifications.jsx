import { useState } from 'react'
import { useAlertNotifications } from '../hooks/useAlertNotifications'
import { MaterialIcon } from './ui'
import { useLanguage } from '../store/LanguageContext'

function formatTime(value, language) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}

export function NotificationPanel({ notifications, unread, connectionState, open, onToggle, onClear }) {
  const { language, t } = useLanguage()
  return <div className="realtime-notifications">
    <button className="notification-trigger" onClick={onToggle} aria-label={t('realtimeNotifications')} aria-expanded={open}>
      <MaterialIcon name="notifications" />
      {unread > 0 && <strong>{unread > 99 ? '99+' : unread}</strong>}
    </button>
    {open && <section className="notification-panel" aria-label={t('realtimeNotificationList')}>
      <header><div><span className={`connection-dot connection-dot--${connectionState}`} /><small>{t(`realtime${connectionState.charAt(0).toUpperCase()}${connectionState.slice(1)}`)}</small><h2>{t('notifications')}</h2></div>{notifications.length > 0 && <button onClick={onClear}>{t('clear')}</button>}</header>
      <div className="notification-list">
        {!notifications.length && <p>{t('noRealtimeAlerts')}</p>}
        {notifications.map((item) => <article key={item.alertId}>
          <div><strong>{item.subject || t('newAlert')}</strong><span className={`priority priority--${item.priority >= 7 ? 'high' : 'normal'}`}>P{item.priority}</span></div>
          <p>{item.sourceSystem} · {item.status}</p>
          <time dateTime={item.createdAt}>{formatTime(item.createdAt, language)}</time>
        </article>)}
      </div>
    </section>}
  </div>
}

export default function RealtimeNotifications() {
  const [open, setOpen] = useState(false)
  const realtime = useAlertNotifications(true)
  const toggle = () => {
    setOpen((value) => !value)
    if (!open) realtime.markAllRead()
  }
  return <NotificationPanel {...realtime} open={open} onToggle={toggle} onClear={realtime.clear} />
}
