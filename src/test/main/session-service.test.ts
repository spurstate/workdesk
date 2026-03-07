// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { listSessions, loadSessionMessages } from '../../main/session-service'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function writeSession(id: string, messages: unknown[]) {
  const dir = path.join(tmpDir, '.claude', 'sessions')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({ messages }))
}

describe('listSessions', () => {
  it('returns empty array when sessions directory does not exist', async () => {
    const result = await listSessions(tmpDir)
    expect(result).toEqual([])
  })

  it('returns sessions sorted by timestamp descending', async () => {
    writeSession('session-a', [{ role: 'user', content: 'Hello A' }])
    // Small delay so mtimes differ
    await new Promise(r => setTimeout(r, 10))
    writeSession('session-b', [{ role: 'user', content: 'Hello B' }])
    const result = await listSessions(tmpDir)
    expect(result.length).toBe(2)
    // Most recent first
    expect(result[0].id).toBe('session-b')
    expect(result[1].id).toBe('session-a')
  })

  it('extracts preview from first user message (string content)', async () => {
    writeSession('s1', [{ role: 'user', content: 'Write me a lesson plan' }])
    const result = await listSessions(tmpDir)
    expect(result[0].preview).toBe('Write me a lesson plan')
  })

  it('extracts preview from array content format', async () => {
    writeSession('s2', [{ role: 'user', content: [{ type: 'text', text: 'Array format message' }] }])
    const result = await listSessions(tmpDir)
    expect(result[0].preview).toBe('Array format message')
  })

  it('uses "Session" as preview when no user message found', async () => {
    writeSession('s3', [{ role: 'assistant', content: 'I am the assistant' }])
    const result = await listSessions(tmpDir)
    expect(result[0].preview).toBe('Session')
  })

  it('truncates long previews to 80 chars', async () => {
    const longContent = 'x'.repeat(200)
    writeSession('s4', [{ role: 'user', content: longContent }])
    const result = await listSessions(tmpDir)
    expect(result[0].preview.length).toBe(80)
  })

  it('skips malformed JSON session files gracefully', async () => {
    const dir = path.join(tmpDir, '.claude', 'sessions')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'bad.json'), 'not-json')
    const result = await listSessions(tmpDir)
    expect(result).toEqual([])
  })

  it('skips non-json files', async () => {
    const dir = path.join(tmpDir, '.claude', 'sessions')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'readme.txt'), 'text')
    const result = await listSessions(tmpDir)
    expect(result).toEqual([])
  })
})

describe('loadSessionMessages', () => {
  it('returns empty array when file does not exist', () => {
    const result = loadSessionMessages(tmpDir, 'nonexistent')
    expect(result).toEqual([])
  })

  it('parses and returns user and assistant messages', () => {
    writeSession('msgs', [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'tool', content: 'tool result' }, // should be filtered out
    ])
    const result = loadSessionMessages(tmpDir, 'msgs')
    expect(result.length).toBe(2)
    expect(result[0]).toEqual({ role: 'user', content: 'Hello' })
    expect(result[1]).toEqual({ role: 'assistant', content: 'Hi there' })
  })

  it('extracts text from array content format', () => {
    writeSession('array-msgs', [
      { role: 'user', content: [{ type: 'text', text: 'Array message' }] },
    ])
    const result = loadSessionMessages(tmpDir, 'array-msgs')
    expect(result[0].content).toBe('Array message')
  })

  it('returns empty string for unknown content format', () => {
    writeSession('unknown-fmt', [
      { role: 'user', content: [{ type: 'image', source: {} }] },
    ])
    const result = loadSessionMessages(tmpDir, 'unknown-fmt')
    expect(result[0].content).toBe('')
  })

  it('returns empty array on malformed JSON', () => {
    const dir = path.join(tmpDir, '.claude', 'sessions')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'broken.json'), '{bad json}')
    const result = loadSessionMessages(tmpDir, 'broken')
    expect(result).toEqual([])
  })
})
