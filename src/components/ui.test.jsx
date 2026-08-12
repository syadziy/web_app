import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, Status } from './ui'

describe('shared UI', () => {
  it('renders reusable table data', () => { render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[{ id: '1', name: 'Scheduler' }]} />); expect(screen.getByRole('cell', { name: 'Scheduler' })).toBeInTheDocument() })
  it('provides a keyboard-focusable horizontal scroll region', () => { const view = within(render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[{ id: '1', name: 'Scheduler' }]} />).container); expect(view.getByRole('region', { name: 'Scrollable data table' })).toHaveAttribute('tabindex', '0') })
  it('requests a new server page with limit and offset', () => { const onChange = vi.fn(); const rows = Array.from({ length: 10 }, (_, index) => ({ id: String(index), name: `Row ${index + 1}` })); const view = within(render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={rows} pagination={{ limit: 10, offset: 0, total: 25, options: [10, 50], onChange }} />).container); fireEvent.click(view.getByRole('button', { name: /Next/ })); expect(onChange).toHaveBeenCalledWith({ limit: 10, offset: 10 }) })
  it('renders the server total and calculated page count', () => { const rows = Array.from({ length: 10 }, (_, index) => ({ id: String(index), name: `Row ${index + 1}` })); render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={rows} pagination={{ limit: 10, offset: 0, total: 327, onChange: vi.fn() }} />); expect(screen.getByText('Showing 1–10 of 327')).toBeInTheDocument(); expect(screen.getByText('Page 1 / 33')).toBeInTheDocument() })
  it('renders English empty state by default', () => { render(<Status empty />); expect(screen.getByText(/No data to display/)).toBeInTheDocument() })
})
