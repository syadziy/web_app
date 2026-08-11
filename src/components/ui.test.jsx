import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable, Status } from './ui'

describe('shared UI', () => {
  it('renders reusable table data', () => { render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[{ id: '1', name: 'Scheduler' }]} />); expect(screen.getByRole('cell', { name: 'Scheduler' })).toBeInTheDocument() })
  it('paginates tables with ten rows by default', () => { const rows = Array.from({ length: 12 }, (_, index) => ({ id: String(index), name: `Row ${index + 1}` })); const view = within(render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={rows} />).container); expect(view.getByText('Row 10')).toBeInTheDocument(); expect(view.queryByText('Row 11')).not.toBeInTheDocument(); fireEvent.click(view.getByRole('button', { name: /Berikutnya/ })); expect(view.getByText('Row 11')).toBeInTheDocument() })
  it('renders empty state', () => { render(<Status empty />); expect(screen.getByText(/Belum ada data/)).toBeInTheDocument() })
})
