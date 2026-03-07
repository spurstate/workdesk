import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import SessionList from '../../../renderer/components/Sidebar/SessionList'

const sessions = [
  { id: 'sess-1', timestamp: Date.now(), preview: 'Write a lesson plan' },
  { id: 'sess-2', timestamp: Date.now() - 1000, preview: 'Unit plan for Year 5' },
]

describe('SessionList', () => {
  it('shows loading text when loading', () => {
    render(<SessionList sessions={[]} loading error="" onResume={vi.fn()} />)
    expect(screen.getByText(/loading sessions/i)).toBeTruthy()
  })

  it('shows error message when error is provided', () => {
    render(<SessionList sessions={[]} loading={false} error="Failed to load" onResume={vi.fn()} />)
    expect(screen.getByText('Failed to load')).toBeTruthy()
  })

  it('shows empty state when no sessions', () => {
    render(<SessionList sessions={[]} loading={false} error="" onResume={vi.fn()} />)
    expect(screen.getByText(/no past sessions/i)).toBeTruthy()
  })

  it('renders session previews', () => {
    render(<SessionList sessions={sessions} loading={false} error="" onResume={vi.fn()} />)
    expect(screen.getByText('Write a lesson plan')).toBeTruthy()
    expect(screen.getByText('Unit plan for Year 5')).toBeTruthy()
  })

  it('calls onResume with session ID when clicked', () => {
    const onResume = vi.fn()
    render(<SessionList sessions={sessions} loading={false} error="" onResume={onResume} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onResume).toHaveBeenCalledWith('sess-1')
  })

  it('uses "Session" as fallback preview when preview is empty', () => {
    const sessionWithEmptyPreview = [{ id: 's3', timestamp: Date.now(), preview: '' }]
    render(<SessionList sessions={sessionWithEmptyPreview} loading={false} error="" onResume={vi.fn()} />)
    expect(screen.getByText('Session')).toBeTruthy()
  })
})
