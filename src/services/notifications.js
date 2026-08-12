import { Client } from '@stomp/stompjs'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:9001').replace(/\/$/, '')
const DEFAULT_WS_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/alerts`
const ALERT_WS_URL = import.meta.env.VITE_ALERT_WS_URL || DEFAULT_WS_URL

export function connectAlertNotifications({ onNotification, onState, onError }) {
  const client = new Client({
    brokerURL: ALERT_WS_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  })

  client.onConnect = () => {
    onState?.('connected')
    client.subscribe('/topic/alerts', (message) => {
      try { onNotification?.(JSON.parse(message.body)) }
      catch (error) { onError?.(error) }
    })
  }
  client.onWebSocketConnecting = () => onState?.('connecting')
  client.onWebSocketClose = () => onState?.('disconnected')
  client.onStompError = (frame) => {
    onState?.('error')
    onError?.(new Error(frame.headers.message || 'Realtime notification connection failed'))
  }
  client.onWebSocketError = () => {
    onState?.('error')
    onError?.(new Error('Realtime notification connection failed'))
  }

  client.activate()
  return () => { void client.deactivate() }
}
