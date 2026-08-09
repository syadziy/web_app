import { useEffect, useState } from 'react'
import { connectAlertNotifications } from '../services/notifications'

const MAX_NOTIFICATIONS = 50

export function useAlertNotifications(token) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [connectionState, setConnectionState] = useState('disconnected')

  useEffect(() => {
    if (!token) {
      setConnectionState('disconnected')
      return undefined
    }
    return connectAlertNotifications({
      token,
      onState: setConnectionState,
      onError: () => setConnectionState('error'),
      onNotification: (notification) => {
        setNotifications((items) => {
          if (items.some((item) => item.alertId === notification.alertId)) return items
          return [notification, ...items].slice(0, MAX_NOTIFICATIONS)
        })
        setUnread((value) => value + 1)
      },
    })
  }, [token])

  return {
    notifications,
    unread,
    connectionState,
    markAllRead: () => setUnread(0),
    clear: () => { setNotifications([]); setUnread(0) },
  }
}
