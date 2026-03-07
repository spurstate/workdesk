import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ApiKeyDialog from '../../../renderer/components/Settings/ApiKeyDialog'

describe('ApiKeyDialog', () => {
  it('shows "Welcome" heading when required=true', () => {
    render(<ApiKeyDialog onSave={vi.fn()} required />)
    expect(screen.getByText(/welcome/i)).toBeTruthy()
  })

  it('shows "Update API Key" heading when not required', () => {
    render(<ApiKeyDialog onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(/update api key/i)).toBeTruthy()
  })

  it('shows Cancel button when onClose is provided and not required', () => {
    render(<ApiKeyDialog onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Cancel')).toBeTruthy()
  })

  it('does not show Cancel button when required=true', () => {
    render(<ApiKeyDialog onSave={vi.fn()} required />)
    expect(screen.queryByText('Cancel')).toBeNull()
  })

  it('shows validation error for non-sk-ant- key', async () => {
    const user = userEvent.setup()
    render(<ApiKeyDialog onSave={vi.fn()} />)
    await user.type(screen.getByTestId('api-key-input'), 'invalid-key')
    await user.click(screen.getByTestId('save-key-btn'))
    expect(screen.getByText(/should start with sk-ant-/i)).toBeTruthy()
  })

  it('calls onSave with trimmed key for valid key', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ApiKeyDialog onSave={onSave} />)
    await user.type(screen.getByTestId('api-key-input'), 'sk-ant-valid-key')
    await user.click(screen.getByTestId('save-key-btn'))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('sk-ant-valid-key'))
  })

  it('shows error when onSave throws', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'))
    const user = userEvent.setup()
    render(<ApiKeyDialog onSave={onSave} />)
    await user.type(screen.getByTestId('api-key-input'), 'sk-ant-key')
    await user.click(screen.getByTestId('save-key-btn'))
    await waitFor(() => expect(screen.getByText('Save failed')).toBeTruthy())
  })

  it('calls onClose when Cancel clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ApiKeyDialog onSave={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('submits on Enter key', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ApiKeyDialog onSave={onSave} />)
    await user.type(screen.getByTestId('api-key-input'), 'sk-ant-key{Enter}')
    await waitFor(() => expect(onSave).toHaveBeenCalled())
  })

  it('Save Key button is disabled when input is empty', () => {
    render(<ApiKeyDialog onSave={vi.fn()} />)
    const btn = screen.getByTestId('save-key-btn') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})
