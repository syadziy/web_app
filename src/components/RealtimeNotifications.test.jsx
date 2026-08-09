import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { afterEach } from 'vitest'
import { NotificationPanel } from './RealtimeNotifications'

describe('realtime notifications', () => {
  afterEach(cleanup)

  it('shows unread count and sanitized alert details', () => {
    render(<NotificationPanel
      open
      unread={2}
      connectionState="connected"
      notifications={[{ alertId: 'a-1', subject: 'Scheduler failed', sourceSystem: 'scheduler', status: 'PENDING', priority: 8, createdAt: '2026-01-02T03:04:05Z' }]}
      onToggle={() => {}}
      onClear={() => {}}
    />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Scheduler failed')).toBeInTheDocument()
    expect(screen.getByText(/scheduler · PENDING/)).toBeInTheDocument()
    expect(screen.getByText('Realtime connected')).toBeInTheDocument()
  })

  it('supports opening and clearing notification panel', () => {
    const toggle = vi.fn(); const clear = vi.fn()
    render(<NotificationPanel open unread={0} connectionState="disconnected" notifications={[{ alertId: 'a-1', subject: 'Alert', sourceSystem: 'audit', status: 'PENDING', priority: 3 }]} onToggle={toggle} onClear={clear} />)
    fireEvent.click(screen.getByLabelText('Notifikasi realtime'))
    fireEvent.click(screen.getByText('Clear'))
    expect(toggle).toHaveBeenCalledOnce()
    expect(clear).toHaveBeenCalledOnce()
  })
})
