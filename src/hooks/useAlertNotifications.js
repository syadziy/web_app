import { useEffect, useRef, useState } from 'react'
import { connectAlertNotifications } from '../services/notifications'

const MAX_NOTIFICATIONS = 50

export function useAlertNotifications(enabled) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [connectionState, setConnectionState] = useState('disconnected')
  const seenAlertIds = useRef(new Set())

  useEffect(() => {
    seenAlertIds.current.clear()
    setNotifications([])
    setUnread(0)

    if (!enabled) {
      setConnectionState('disconnected')
      return undefined
    }
    return connectAlertNotifications({
      onState: setConnectionState,
      onError: () => setConnectionState('error'),
      onNotification: (notification) => {
        if (seenAlertIds.current.has(notification.alertId)) return
        seenAlertIds.current.add(notification.alertId)
        setNotifications((items) => [notification, ...items].slice(0, MAX_NOTIFICATIONS))
        setUnread((value) => value + 1)
      },
    })
  }, [enabled])

  return {
    notifications,
    unread,
    connectionState,
    markAllRead: () => setUnread(0),
    clear: () => {
      seenAlertIds.current.clear()
      setNotifications([])
      setUnread(0)
    },
  }
}
