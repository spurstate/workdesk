// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron
vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
  app: {
    isPackaged: false,
    getAppPath: vi.fn(() => '/app'),
    getPath: vi.fn(() => '/tmp'),
  },
}))

// Mock child_process
vi.mock('child_process', () => ({
  execFileSync: vi.fn(() => '/usr/local/bin/node'),
}))

// Mock config-service
const mockGetApiKey = vi.fn(() => 'sk-test-key')
const mockGetModel = vi.fn(() => 'claude-haiku-4-5-20251001')

vi.mock('../../main/config-service', () => ({
  getApiKey: mockGetApiKey,
  getModel: mockGetModel,
}))

// Mock the SDK — return a controllable async generator
let mockQueryEvents: unknown[] = []
const mockQuery = vi.fn((_opts: unknown) => {
  return (async function* () {
    for (const event of mockQueryEvents) {
      yield event
    }
  })()
})

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: mockQuery,
}))

const { runQuery, abortCurrentQuery } = await import('../../main/agent-service')

function makeMockWin() {
  return {
    webContents: { send: vi.fn() },
    isDestroyed: vi.fn(() => false),
  } as any
}

function tokenEvent(text: string) {
  return {
    type: 'stream_event',
    event: { type: 'content_block_delta', delta: { type: 'text_delta', text } },
  }
}

function toolStartEvent(name: string) {
  return {
    type: 'stream_event',
    event: { type: 'content_block_start', content_block: { type: 'tool_use', name } },
  }
}

function toolEndEvent() {
  return {
    type: 'stream_event',
    event: { type: 'content_block_stop' },
  }
}

function assistantEvent(text: string) {
  return {
    type: 'assistant',
    message: { content: [{ type: 'text', text }] },
  }
}

function resultEvent(sessionId: string) {
  return { type: 'result', session_id: sessionId }
}

describe('runQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetApiKey.mockReturnValue('sk-test-key')
    mockGetModel.mockReturnValue('claude-haiku-4-5-20251001')
    mockQueryEvents = []
  })

  it('streams tokens to window via STREAM.TOKEN', async () => {
    mockQueryEvents = [tokenEvent('Hello'), tokenEvent(' world'), resultEvent('sess-1')]
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const calls = win.webContents.send.mock.calls
    const tokenCalls = calls.filter((c: string[]) => c[0] === 'stream:token')
    expect(tokenCalls).toHaveLength(2)
    expect(tokenCalls[0][1]).toBe('Hello')
    expect(tokenCalls[1][1]).toBe(' world')
  })

  it('sends STREAM.DONE with session ID from result event', async () => {
    mockQueryEvents = [resultEvent('session-abc')]
    const win = makeMockWin()
    const finalId = await runQuery(win, 'test', '/workspace')
    expect(finalId).toBe('session-abc')
    const doneCalls = win.webContents.send.mock.calls.filter((c: string[]) => c[0] === 'stream:done')
    expect(doneCalls).toHaveLength(1)
    expect(doneCalls[0][1]).toEqual({ sessionId: 'session-abc' })
  })

  it('sends STREAM.ASSISTANT_COMPLETE on assistant message', async () => {
    mockQueryEvents = [assistantEvent('Final answer'), resultEvent('sess-2')]
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const completeCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:assistant-complete'
    )
    expect(completeCalls).toHaveLength(1)
    expect(completeCalls[0][1]).toBe('Final answer')
  })

  it('sends STREAM.TOOL_START and STREAM.TOOL_END on tool events', async () => {
    mockQueryEvents = [toolStartEvent('Read'), toolEndEvent(), resultEvent('sess-3')]
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const toolStartCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:tool-start'
    )
    const toolEndCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:tool-end'
    )
    expect(toolStartCalls[0][1]).toBe('Read')
    expect(toolEndCalls).toHaveLength(1)
  })

  it('sends STREAM.ERROR on non-abort errors', async () => {
    mockQuery.mockImplementationOnce(() => {
      throw new Error('SDK failure')
    })
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const errorCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:error'
    )
    expect(errorCalls).toHaveLength(1)
    expect(errorCalls[0][1]).toBe('SDK failure')
  })

  it('swallows AbortError silently', async () => {
    const abortErr = new Error('Aborted')
    abortErr.name = 'AbortError'
    mockQuery.mockImplementationOnce(() => {
      throw abortErr
    })
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const errorCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:error'
    )
    expect(errorCalls).toHaveLength(0)
  })

  it('throws when no API key configured', async () => {
    mockGetApiKey.mockReturnValue(null)
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const errorCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:error'
    )
    expect(errorCalls).toHaveLength(1)
    expect(errorCalls[0][1]).toMatch(/No API key/i)
  })

  it('sends failsafe DONE when no result event received', async () => {
    mockQueryEvents = [tokenEvent('text')]
    const win = makeMockWin()
    await runQuery(win, 'test', '/workspace')
    const doneCalls = win.webContents.send.mock.calls.filter(
      (c: string[]) => c[0] === 'stream:done'
    )
    expect(doneCalls).toHaveLength(1)
  })
})

describe('abortCurrentQuery', () => {
  it('does not throw when no query is running', () => {
    expect(() => abortCurrentQuery()).not.toThrow()
  })
})
