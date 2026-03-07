import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../../../renderer/hooks/useChat'
import { mockWindowApi } from '../../mocks/window-api'

// The reducer is the most important thing to test — verify it directly by
// testing the hook's exported state after dispatching known sequences of events.

describe('useChat — reducer via hook', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useChat())
    expect(result.current.messages).toEqual([])
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.streamingText).toBe('')
    expect(result.current.activeTool).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('USER_MESSAGE adds a user message and sets isStreaming', async () => {
    const { result } = renderHook(() => useChat())
    await act(async () => {
      await result.current.sendMessage('Hello')
    })
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[0].content).toBe('Hello')
    expect(result.current.isStreaming).toBe(true)
  })

  it('sendMessage uses displayText when provided', async () => {
    const { result } = renderHook(() => useChat())
    await act(async () => {
      await result.current.sendMessage('internal prompt', 'Display text')
    })
    expect(result.current.messages[0].content).toBe('Display text')
    expect(mockWindowApi.chat.send).toHaveBeenCalledWith('internal prompt', undefined)
  })

  it('abort clears streaming state', () => {
    const { result } = renderHook(() => useChat())
    act(() => {
      result.current.abort()
    })
    expect(result.current.isStreaming).toBe(false)
    expect(mockWindowApi.chat.abort).toHaveBeenCalled()
  })

  it('clearChat resets to empty state', async () => {
    const { result } = renderHook(() => useChat())
    await act(async () => {
      await result.current.sendMessage('test')
    })
    act(() => {
      result.current.clearChat()
    })
    expect(result.current.messages).toEqual([])
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.currentSessionId).toBeUndefined()
  })

  it('resumeSession loads messages and session ID', () => {
    const { result } = renderHook(() => useChat())
    const msgs = [
      { id: '1', role: 'user' as const, content: 'hi', timestamp: 1 },
      { id: '2', role: 'assistant' as const, content: 'hello', timestamp: 2 },
    ]
    act(() => {
      result.current.resumeSession('sess-abc', msgs)
    })
    expect(result.current.messages).toEqual(msgs)
    expect(result.current.currentSessionId).toBe('sess-abc')
    expect(result.current.isStreaming).toBe(false)
  })

  it('dispatches ERROR when sendMessage throws', async () => {
    mockWindowApi.chat.send.mockRejectedValueOnce(new Error('Send failed'))
    const { result } = renderHook(() => useChat())
    await act(async () => {
      await result.current.sendMessage('test')
    })
    expect(result.current.error).toBe('Send failed')
    expect(result.current.isStreaming).toBe(false)
  })

  it('triggerAutoGreeting calls window.api.chat.send once', async () => {
    const { result } = renderHook(() => useChat())
    await act(async () => {
      await result.current.triggerAutoGreeting()
    })
    expect(mockWindowApi.chat.send).toHaveBeenCalledOnce()
    // Second call should be ignored (hasTriggeredGreeting guard)
    await act(async () => {
      await result.current.triggerAutoGreeting()
    })
    expect(mockWindowApi.chat.send).toHaveBeenCalledOnce()
  })
})

describe('useChat — streaming event subscriptions', () => {
  it('subscribes to all stream events on mount and unsubscribes on unmount', () => {
    const unsubToken = vi.fn()
    const unsubTool = vi.fn()
    const unsubToolEnd = vi.fn()
    const unsubComplete = vi.fn()
    const unsubError = vi.fn()
    const unsubDone = vi.fn()

    mockWindowApi.chat.onToken.mockReturnValue(unsubToken)
    mockWindowApi.chat.onToolStart.mockReturnValue(unsubTool)
    mockWindowApi.chat.onToolEnd.mockReturnValue(unsubToolEnd)
    mockWindowApi.chat.onAssistantComplete.mockReturnValue(unsubComplete)
    mockWindowApi.chat.onError.mockReturnValue(unsubError)
    mockWindowApi.chat.onDone.mockReturnValue(unsubDone)

    const { unmount } = renderHook(() => useChat())
    expect(mockWindowApi.chat.onToken).toHaveBeenCalled()
    expect(mockWindowApi.chat.onDone).toHaveBeenCalled()

    unmount()
    expect(unsubToken).toHaveBeenCalled()
    expect(unsubDone).toHaveBeenCalled()
  })

  it('processes streaming events via registered callbacks', () => {
    const cbs: Record<string, Function> = {}
    mockWindowApi.chat.onToken.mockImplementation((cb: Function) => { cbs.token = cb; return vi.fn() })
    mockWindowApi.chat.onToolStart.mockImplementation((cb: Function) => { cbs.toolStart = cb; return vi.fn() })
    mockWindowApi.chat.onToolEnd.mockImplementation((cb: Function) => { cbs.toolEnd = cb; return vi.fn() })
    mockWindowApi.chat.onAssistantComplete.mockImplementation((cb: Function) => { cbs.complete = cb; return vi.fn() })
    mockWindowApi.chat.onError.mockImplementation((cb: Function) => { cbs.error = cb; return vi.fn() })
    mockWindowApi.chat.onDone.mockImplementation((cb: Function) => { cbs.done = cb; return vi.fn() })

    const { result } = renderHook(() => useChat())

    act(() => { cbs.token('Hello ') })
    act(() => { cbs.token('world') })
    expect(result.current.streamingText).toBe('Hello world')

    act(() => { cbs.toolStart('Read') })
    expect(result.current.activeTool).toBe('Read')

    act(() => { cbs.toolEnd() })
    expect(result.current.activeTool).toBeNull()

    act(() => { cbs.complete('Final response') })
    expect(result.current.messages.some((m) => m.content === 'Final response')).toBe(true)

    act(() => { cbs.done({ sessionId: 'sess-xyz' }) })
    expect(result.current.currentSessionId).toBe('sess-xyz')
    expect(result.current.isStreaming).toBe(false)
  })

  it('onDone with empty sessionId preserves existing session', () => {
    const cbs: Record<string, Function> = {}
    mockWindowApi.chat.onToken.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onToolStart.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onToolEnd.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onAssistantComplete.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onError.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onDone.mockImplementation((cb: Function) => { cbs.done = cb; return vi.fn() })

    const { result } = renderHook(() => useChat())
    act(() => { result.current.resumeSession('existing-sess', []) })
    act(() => { cbs.done({ sessionId: '' }) })
    expect(result.current.currentSessionId).toBe('existing-sess')
  })

  it('dispatches ERROR with fallback when triggerAutoGreeting fails without message', async () => {
    mockWindowApi.chat.send.mockRejectedValueOnce('plain string error')
    const { result } = renderHook(() => useChat())
    await act(async () => {
      await result.current.triggerAutoGreeting()
    })
    expect(result.current.error).toBe('Failed to initialise')
  })

  it('dispatches ERROR from onError callback', () => {
    let errorCb: Function
    mockWindowApi.chat.onToken.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onToolStart.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onToolEnd.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onAssistantComplete.mockImplementation(() => vi.fn())
    mockWindowApi.chat.onError.mockImplementation((cb: Function) => { errorCb = cb; return vi.fn() })
    mockWindowApi.chat.onDone.mockImplementation(() => vi.fn())

    const { result } = renderHook(() => useChat())
    act(() => { errorCb!('Stream failed') })
    expect(result.current.error).toBe('Stream failed')
  })
})
