import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import HowToUseModal from '../../../renderer/components/HowToUseModal'

describe('HowToUseModal', () => {
  it('renders the modal heading', () => {
    render(<HowToUseModal onClose={vi.fn()} />)
    expect(screen.getByText('How to Use Workdesk')).toBeTruthy()
  })

  it('renders all three task types', () => {
    render(<HowToUseModal onClose={vi.fn()} />)
    expect(screen.getByText('Lesson Plan')).toBeTruthy()
    expect(screen.getByText('Unit Plan')).toBeTruthy()
    expect(screen.getByText('Report Comments')).toBeTruthy()
  })

  it('calls onClose when ✕ is clicked', () => {
    const onClose = vi.fn()
    render(<HowToUseModal onClose={onClose} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when "Got it" button is clicked', () => {
    const onClose = vi.fn()
    render(<HowToUseModal onClose={onClose} />)
    fireEvent.click(screen.getByText('Got it'))
    expect(onClose).toHaveBeenCalled()
  })
})
