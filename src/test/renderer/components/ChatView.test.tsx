import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ChatView from '../../../renderer/components/Chat/ChatView'
import { mockWindowApi } from '../../mocks/window-api'

const defaultProps = {
  messages: [],
  isStreaming: false,
  streamingText: '',
  activeTool: null,
  error: null,
  onSend: vi.fn(),
  onAbort: vi.fn(),
}

describe('ChatView', () => {
  it('shows empty state when no messages', () => {
    render(<ChatView {...defaultProps} />)
    expect(screen.getByText(/type a message/i)).toBeTruthy()
  })

  it('renders messages when provided', () => {
    const messages = [{ id: '1', role: 'user' as const, content: 'Hello', timestamp: 1 }]
    render(<ChatView {...defaultProps} messages={messages} />)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('shows streaming text when isStreaming and streamingText set', () => {
    render(<ChatView {...defaultProps} isStreaming streamingText="Claude is typing..." />)
    expect(screen.getByText('Claude is typing...')).toBeTruthy()
  })

  it('shows tool indicator when activeTool is set', () => {
    render(<ChatView {...defaultProps} isStreaming activeTool="Read" />)
    expect(screen.getAllByText('Reading files…').length).toBeGreaterThan(0)
  })

  it('shows error message when error is set', () => {
    render(<ChatView {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })

  it('renders the model selector', () => {
    render(<ChatView {...defaultProps} />)
    expect(screen.getByRole('combobox')).toBeTruthy()
  })

  it('loads and displays model from API on mount', async () => {
    mockWindowApi.config.getModel.mockResolvedValue('claude-sonnet-4-6')
    render(<ChatView {...defaultProps} />)
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('claude-sonnet-4-6')
    })
  })

  it('calls setModel when model is changed', async () => {
    const user = userEvent.setup()
    render(<ChatView {...defaultProps} />)
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'claude-opus-4-6')
    expect(mockWindowApi.config.setModel).toHaveBeenCalledWith('claude-opus-4-6')
  })

  it('disables model selector while streaming', () => {
    render(<ChatView {...defaultProps} isStreaming />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.disabled).toBe(true)
  })

  it('shows "Claude is thinking" status when streaming without text', () => {
    render(<ChatView {...defaultProps} isStreaming streamingText="" />)
    expect(screen.getByText(/claude is thinking/i)).toBeTruthy()
  })

  it('shows "Claude is responding" status when streaming with text', () => {
    render(<ChatView {...defaultProps} isStreaming streamingText="Some text" />)
    expect(screen.getByText(/claude is responding/i)).toBeTruthy()
  })

  it('shows tool status when streaming with activeTool', () => {
    render(<ChatView {...defaultProps} isStreaming activeTool="Write" />)
    expect(screen.getAllByText('Writing document…').length).toBeGreaterThan(0)
  })
})
