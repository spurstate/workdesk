import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock the logo import so the img src doesn't cause issues in happy-dom
vi.mock('../../../renderer/assets/logo.png', () => ({ default: 'logo.png' }))

import LoadingScreen from '../../../renderer/components/LoadingScreen'

describe('LoadingScreen', () => {
  it('renders the Workdesk label', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('Workdesk')).toBeTruthy()
  })

  it('renders the powered by Anthropic text', () => {
    render(<LoadingScreen />)
    expect(screen.getByText(/powered by anthropic/i)).toBeTruthy()
  })

  it('renders the logo image', () => {
    render(<LoadingScreen />)
    const img = screen.getByAltText('Workdesk')
    expect(img).toBeTruthy()
  })
})
