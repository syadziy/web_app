import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SchedulerPage from './SchedulerPage'

const auth = vi.hoisted(() => ({ read: true, manage: true }))
const api = vi.hoisted(() => ({
  tasks: vi.fn(),
  groups: vi.fn(),
  schedules: vi.fn(),
  histories: vi.fn(),
  createTask: vi.fn(),
  createGroup: vi.fn(),
  createSchedule: vi.fn(),
}))

vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({
    can: (permission) => permission === 'scheduler:read' ? auth.read : permission === 'scheduler:manage' && auth.manage,
  }),
}))
vi.mock('../store/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key, values = {}) => ({
      group: 'Group',
      groups: 'Groups',
      tasks: 'Tasks',
      name: 'Name',
      save: 'Save',
      createTaskGroup: 'Create task group',
      directTasks: 'Direct tasks',
      nestedGroups: 'Nested groups',
      selectLabel: `Select ${values.label}`,
    })[key] || key,
  }),
}))
vi.mock('../services/api', () => ({ schedulerApi: api }))

const page = (data = []) => ({ data, paging: { total_record: data.length } })

describe('SchedulerPage task groups', () => {
  beforeEach(() => {
    auth.read = true
    auth.manage = true
    api.tasks.mockResolvedValue(page([{ id: 'task-1', name: 'Task Alpha', method: 'GET', endpoint: 'https://example.com' }]))
    api.groups.mockResolvedValue(page([{ id: 'group-1', name: 'Child Group', executionMode: 'SERIAL' }]))
    api.schedules.mockResolvedValue(page())
    api.histories.mockResolvedValue(page())
    api.createGroup.mockResolvedValue({ groupId: 'new-group' })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('creates a group from selected tasks and nested groups', async () => {
    render(<SchedulerPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Group/i }))
    await screen.findByRole('dialog', { name: 'Create task group' })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Operations Group' } })

    await waitFor(() => expect(screen.getByText('Task Alpha')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Select tasks'))
    fireEvent.click(screen.getByLabelText(/Task Alpha/))
    fireEvent.click(screen.getByText('Select groups'))
    fireEvent.click(screen.getByLabelText(/Child Group/))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(api.createGroup).toHaveBeenCalledWith({
      name: 'Operations Group',
      executionMode: 'SERIAL',
      taskIds: ['task-1'],
      groupIds: ['group-1'],
      enabled: true,
    }))
  })

  it('hides group creation when task and group choices cannot be read', async () => {
    auth.read = false

    render(<SchedulerPage />)

    expect(screen.queryByRole('button', { name: /\+ Group/i })).not.toBeInTheDocument()
    expect(api.tasks).not.toHaveBeenCalled()
    expect(api.groups).not.toHaveBeenCalled()
  })
})
