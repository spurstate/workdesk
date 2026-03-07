import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import MessageList from '../../../renderer/components/Chat/MessageList'

const messages = [
  { id: '1', role: 'user' as const, content: 'Hello', timestamp: 1 },
  { id: '2', role: 'assistant' as const, content: 'Hi there', timestamp: 2 },
]

describe('MessageList', () => {
  it('renders all messages', () => {
    render(<MessageList messages={messages} />)
    expect(screen.getByText('Hello')).toBeTruthy()
    expect(screen.getByText('Hi there')).toBeTruthy()
  })

  it('renders empty list without error', () => {
    const { container } = render(<MessageList messages={[]} />)
    expect(container.firstChild).toBeTruthy()
  })
})
