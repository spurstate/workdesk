import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import App from '../../renderer/App'
import { mockWindowApi } from '../mocks/window-api'

// Mock child components that have complex dependencies or are not the focus
vi.mock('../../renderer/assets/logo.png', () => ({ default: 'logo.png' }))
vi.mock('../../renderer/components/MainLayout', () => ({
  default: () => <div data-testid="main-layout">MainLayout</div>,
}))
vi.mock('../../renderer/components/Setup/ContextWizard', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="context-wizard">
      <button onClick={onComplete}>Complete wizard</button>
    </div>
  ),
}))

describe('App — loading state', () => {
  it('shows LoadingScreen while config or subscription key check is pending', async () => {
    // Keep config loading forever
    mockWindowApi.config.getKeyStatus.mockReturnValue(new Promise(() => {}))
    mockWindowApi.subscriptionKey.getStatus.mockReturnValue(new Promise(() => {}))
    render(<App />)
    // LoadingScreen renders bouncing dots
    const spans = document.querySelectorAll('.animate-bounce')
    expect(spans.length).toBeGreaterThan(0)
  })
})

describe('App — subscription key gating', () => {
  it('shows SubscriptionKeyDialog when subscription key is needed', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(true)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue({
      valid: false,
      message: 'Subscription expired',
      storedKey: 'SBK-old',
    })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText(/enter your subscription key/i)).toBeTruthy()
    , { timeout: 3000 })
  })

  it('proceeds to normal flow when subscription is valid (null dev bypass)', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(false)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue(null)
    render(<App />)
    // With null status (dev bypass), should show api-key or wizard step after loading
    await waitFor(() =>
      expect(screen.queryByText(/enter your subscription key/i)).toBeNull()
    , { timeout: 3000 })
  })

  it('proceeds when subscription is valid', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(false)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue({ valid: true })
    render(<App />)
    await waitFor(() =>
      expect(screen.queryByText(/enter your subscription key/i)).toBeNull()
    , { timeout: 3000 })
  })
})

describe('App — setup flow', () => {
  it('shows ApiKeyDialog when no API key is configured', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(false)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue(null)
    render(<App />)
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/sk-ant-/i)).toBeTruthy()
    , { timeout: 3000 })
  })

  it('shows ContextWizard when key is set but wizard not done', async () => {
    localStorage.clear()
    mockWindowApi.config.getKeyStatus.mockResolvedValue(true)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue(null)
    render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('context-wizard')).toBeTruthy()
    , { timeout: 3000 })
  })

  it('shows MainLayout when setup is complete', async () => {
    localStorage.setItem('wizardComplete', 'true')
    mockWindowApi.config.getKeyStatus.mockResolvedValue(true)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue(null)
    render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('main-layout')).toBeTruthy()
    , { timeout: 3000 })
    localStorage.clear()
  })

  it('completes wizard and transitions to main layout', async () => {
    localStorage.clear()
    mockWindowApi.config.getKeyStatus.mockResolvedValue(true)
    mockWindowApi.subscriptionKey.getStatus.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('context-wizard')).toBeTruthy(), { timeout: 3000 })
    await user.click(screen.getByText('Complete wizard'))
    await waitFor(() => expect(screen.getByTestId('main-layout')).toBeTruthy())
    localStorage.clear()
  })
})
