import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import MessageBubble from '../../../renderer/components/Chat/MessageBubble'

const userMessage = {
  id: '1',
  role: 'user' as const,
  content: 'Hello, teacher assistant!',
  timestamp: Date.now(),
}

const assistantMessage = {
  id: '2',
  role: 'assistant' as const,
  content: 'Hello! How can I help you today?',
  timestamp: Date.now(),
}

describe('MessageBubble', () => {
  it('renders user message content', () => {
    render(<MessageBubble message={userMessage} />)
    expect(screen.getByText('Hello, teacher assistant!')).toBeTruthy()
  })

  it('renders assistant message content via markdown', () => {
    render(<MessageBubble message={assistantMessage} />)
    expect(screen.getByText('Hello! How can I help you today?')).toBeTruthy()
  })

  it('renders user avatar emoji', () => {
    render(<MessageBubble message={userMessage} />)
    expect(screen.getByText('👤')).toBeTruthy()
  })

  it('renders assistant avatar emoji', () => {
    render(<MessageBubble message={assistantMessage} />)
    expect(screen.getByText('🤖')).toBeTruthy()
  })

  it('wraps assistant content in markdown renderer', () => {
    const { container } = render(
      <MessageBubble message={{ ...assistantMessage, content: '**bold text**' }} />
    )
    expect(container.querySelector('strong')).toBeTruthy()
  })
})
