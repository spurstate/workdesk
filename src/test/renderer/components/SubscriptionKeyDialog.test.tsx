import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import SubscriptionKeyDialog from '../../../renderer/components/Setup/SubscriptionKeyDialog'
import { mockWindowApi } from '../../mocks/window-api'

describe('SubscriptionKeyDialog', () => {
  it('renders the dialog heading', () => {
    render(<SubscriptionKeyDialog onValidated={vi.fn()} />)
    expect(screen.getByText(/enter your subscription key/i)).toBeTruthy()
  })

  it('pre-populates input when storedKey is provided', () => {
    render(<SubscriptionKeyDialog storedKey="SBK-existing" onValidated={vi.fn()} />)
    const input = screen.getByPlaceholderText(/subscription key/i) as HTMLInputElement
    expect(input.value).toBe('SBK-existing')
  })

  it('shows "Use a different key" button when storedKey provided', () => {
    render(<SubscriptionKeyDialog storedKey="SBK-existing" onValidated={vi.fn()} />)
    expect(screen.getByText(/use a different key/i)).toBeTruthy()
  })

  it('does not show "Use a different key" button without storedKey', () => {
    render(<SubscriptionKeyDialog onValidated={vi.fn()} />)
    expect(screen.queryByText(/use a different key/i)).toBeNull()
  })

  it('calls onValidated when validation succeeds', async () => {
    const onValidated = vi.fn()
    mockWindowApi.subscriptionKey.validate.mockResolvedValue({ valid: true })
    const user = userEvent.setup()
    render(<SubscriptionKeyDialog onValidated={onValidated} />)
    const input = screen.getByPlaceholderText(/subscription key/i)
    await user.type(input, 'SBK-valid-key')
    await user.click(screen.getByRole('button', { name: /activate/i }))
    await waitFor(() => expect(onValidated).toHaveBeenCalled())
  })

  it('shows error message when validation returns invalid', async () => {
    mockWindowApi.subscriptionKey.validate.mockResolvedValue({
      valid: false,
      message: 'Your subscription has expired',
    })
    const user = userEvent.setup()
    render(<SubscriptionKeyDialog onValidated={vi.fn()} />)
    const input = screen.getByPlaceholderText(/subscription key/i)
    await user.type(input, 'SBK-bad')
    await user.click(screen.getByRole('button', { name: /activate/i }))
    await waitFor(() => expect(screen.getByText('Your subscription has expired')).toBeTruthy())
  })

  it('shows network error when validation throws', async () => {
    mockWindowApi.subscriptionKey.validate.mockRejectedValueOnce(new Error('Network'))
    const user = userEvent.setup()
    render(<SubscriptionKeyDialog onValidated={vi.fn()} />)
    const input = screen.getByPlaceholderText(/subscription key/i)
    await user.type(input, 'SBK-net-error')
    await user.click(screen.getByRole('button', { name: /activate/i }))
    await waitFor(() =>
      expect(screen.getByText(/could not reach the server/i)).toBeTruthy()
    )
  })

  it('clears key and hides stored key button on "Use a different key"', async () => {
    const user = userEvent.setup()
    render(<SubscriptionKeyDialog storedKey="SBK-old" onValidated={vi.fn()} />)
    await user.click(screen.getByText(/use a different key/i))
    expect(mockWindowApi.subscriptionKey.clear).toHaveBeenCalled()
    const input = screen.getByPlaceholderText(/subscription key/i) as HTMLInputElement
    expect(input.value).toBe('')
    expect(screen.queryByText(/use a different key/i)).toBeNull()
  })

  it('submits on Enter key press', async () => {
    const onValidated = vi.fn()
    mockWindowApi.subscriptionKey.validate.mockResolvedValue({ valid: true })
    const user = userEvent.setup()
    render(<SubscriptionKeyDialog onValidated={onValidated} />)
    const input = screen.getByPlaceholderText(/subscription key/i)
    await user.type(input, 'SBK-enter-test{Enter}')
    await waitFor(() => expect(onValidated).toHaveBeenCalled())
  })

  it('Activate button is disabled when input is empty', () => {
    render(<SubscriptionKeyDialog onValidated={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /activate/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})
