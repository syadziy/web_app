import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable, Status } from './ui'

describe('shared UI', () => {
  it('renders reusable table data', () => { render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[{ id: '1', name: 'Scheduler' }]} />); expect(screen.getByRole('cell', { name: 'Scheduler' })).toBeInTheDocument() })
  it('renders empty state', () => { render(<Status empty />); expect(screen.getByText(/Belum ada data/)).toBeInTheDocument() })
})
