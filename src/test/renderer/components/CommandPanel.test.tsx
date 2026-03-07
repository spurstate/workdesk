import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import CommandPanel from '../../../renderer/components/Commands/CommandPanel'
import { mockWindowApi } from '../../mocks/window-api'

describe('CommandPanel', () => {
  it('renders all command buttons', () => {
    render(<CommandPanel onSubmit={vi.fn()} />)
    expect(screen.getByText(/lesson plan/i)).toBeTruthy()
    expect(screen.getByText(/unit plan/i)).toBeTruthy()
    expect(screen.getByText(/report comments/i)).toBeTruthy()
  })

  it('shows lesson plan form when Lesson Plan is clicked', async () => {
    const user = userEvent.setup()
    render(<CommandPanel onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /lesson plan/i }))
    expect(screen.getByText('Topic *')).toBeTruthy()
  })

  it('shows unit plan form when Unit Plan is clicked', async () => {
    const user = userEvent.setup()
    render(<CommandPanel onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /unit plan/i }))
    expect(screen.getByText(/generate unit plan/i)).toBeTruthy()
  })

  it('shows report comments form when Report Comments is clicked', async () => {
    const user = userEvent.setup()
    render(<CommandPanel onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /report comments/i }))
    expect(screen.getByText(/generate report comments/i)).toBeTruthy()
  })

  it('toggles form closed when same command is clicked twice', async () => {
    const user = userEvent.setup()
    render(<CommandPanel onSubmit={vi.fn()} />)
    const lessonBtn = screen.getByRole('button', { name: /lesson plan/i })
    await user.click(lessonBtn)
    expect(screen.getByText('Topic *')).toBeTruthy()
    await user.click(lessonBtn)
    expect(screen.queryByText('Topic *')).toBeNull()
  })

  it('calls onSubmit with prompt when command is submitted', async () => {
    const onSubmit = vi.fn()
    mockWindowApi.command.buildPrompt.mockResolvedValue('Generated prompt')
    const user = userEvent.setup()
    render(<CommandPanel onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: /lesson plan/i }))
    await user.type(screen.getByPlaceholderText(/persuasive writing/i), 'Topic')
    await user.type(screen.getByPlaceholderText(/year 5\/6/i), 'Y5')
    await user.click(screen.getByText(/generate lesson plan/i))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Generated prompt', expect.any(String)))
  })

  it('shows error when buildPrompt fails', async () => {
    mockWindowApi.command.buildPrompt.mockRejectedValueOnce(new Error('Build error'))
    const user = userEvent.setup()
    render(<CommandPanel onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /lesson plan/i }))
    await user.type(screen.getByPlaceholderText(/persuasive writing/i), 'Topic')
    await user.type(screen.getByPlaceholderText(/year 5\/6/i), 'Y5')
    await user.click(screen.getByText(/generate lesson plan/i))
    await waitFor(() => expect(screen.getByText('Build error')).toBeTruthy())
  })
})
