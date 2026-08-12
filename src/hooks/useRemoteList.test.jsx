import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRemoteList } from './useRemoteList'

describe('useRemoteList pagination', () => {
  it('loads a new server page whenever limit or offset changes', async () => {
    const loader = vi.fn((signal, page) => Promise.resolve({
      data: [{ id: `${page.offset}` }],
      paging: { total: 25 },
    }))
    const { result } = renderHook(() => useRemoteList(loader, 'items', true, {
      defaultLimit: 10,
      options: [10, 50, 100, 500],
    }))

    await waitFor(() => expect(loader).toHaveBeenCalledWith(expect.any(AbortSignal), { limit: 10, offset: 0 }))
    act(() => result.current.pagination.onChange({ limit: 10, offset: 10 }))
    await waitFor(() => expect(loader).toHaveBeenLastCalledWith(expect.any(AbortSignal), { limit: 10, offset: 10 }))
    await waitFor(() => expect(result.current.data).toEqual([{ id: '10' }]))
  })

  it('uses total_record from the API paging response', async () => {
    const loader = vi.fn(() => Promise.resolve({
      data: Array.from({ length: 10 }, (_, index) => ({ id: String(index + 1) })),
      paging: { limit: 10, offset: 0, total_record: 327 },
    }))
    const { result } = renderHook(() => useRemoteList(loader, 'audit-logs', true, {
      defaultLimit: 10,
      options: [10, 50, 100, 500],
    }))

    await waitFor(() => expect(result.current.pagination.total).toBe(327))
  })
})
