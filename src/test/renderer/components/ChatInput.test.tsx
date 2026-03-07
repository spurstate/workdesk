import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ChatInput from '../../../renderer/components/Chat/ChatInput'

describe('ChatInput', () => {
  const defaultProps = {
    onSend: vi.fn(),
    onAbort: vi.fn(),
    isStreaming: false,
  }

  it('renders the text input', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('chat-input')).toBeTruthy()
  })

  it('shows Send button when not streaming', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('chat-send')).toBeTruthy()
  })

  it('shows Stop button when streaming', () => {
    render(<ChatInput {...defaultProps} isStreaming />)
    expect(screen.getByTestId('chat-stop')).toBeTruthy()
  })

  it('calls onSend with trimmed text on Send button click', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} onSend={onSend} />)
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Hello world')
    await user.click(screen.getByTestId('chat-send'))
    expect(onSend).toHaveBeenCalledWith('Hello world')
  })

  it('calls onSend on Enter key press', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} onSend={onSend} />)
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Test message{Enter}')
    expect(onSend).toHaveBeenCalledWith('Test message')
  })

  it('does not call onSend on Shift+Enter', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} onSend={onSend} />)
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Line one')
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('does not call onSend for empty input', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} onSend={onSend} />)
    await user.click(screen.getByTestId('chat-send'))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('clears input after send', async () => {
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} />)
    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    await user.type(input, 'message')
    await user.click(screen.getByTestId('chat-send'))
    expect(input.value).toBe('')
  })

  it('calls onAbort when Stop is clicked', async () => {
    const onAbort = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} onAbort={onAbort} isStreaming />)
    await user.click(screen.getByTestId('chat-stop'))
    expect(onAbort).toHaveBeenCalled()
  })

  it('disables input while streaming', () => {
    render(<ChatInput {...defaultProps} isStreaming />)
    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    expect(input.disabled).toBe(true)
  })
})
