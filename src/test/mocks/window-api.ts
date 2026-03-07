import { vi } from 'vitest'

export const mockWindowApi = {
  config: {
    getKeyStatus: vi.fn(async () => false),
    setKey: vi.fn(async () => {}),
    clearKey: vi.fn(async () => {}),
    getModel: vi.fn(async () => 'claude-haiku-4-5-20251001'),
    setModel: vi.fn(async () => {}),
  },
  output: {
    listFiles: vi.fn(async () => []),
    onFilesChanged: vi.fn(() => () => {}),
  },
  workspace: {
    getCurrent: vi.fn(async () => '/test/workspace'),
    listFiles: vi.fn(async () => []),
    readFile: vi.fn(async () => ''),
    onFilesChanged: vi.fn(() => () => {}),
    listContextFiles: vi.fn(async () => []),
    onContextChanged: vi.fn(() => () => {}),
  },
  context: {
    writeFile: vi.fn(async () => {}),
  },
  curriculum: {
    listFiles: vi.fn(async () => []),
    importFile: vi.fn(async () => []),
    deleteFile: vi.fn(async () => {}),
  },
  files: {
    export: vi.fn(async () => true),
  },
  command: {
    buildPrompt: vi.fn(async () => ''),
  },
  session: {
    list: vi.fn(async () => []),
    loadMessages: vi.fn(async () => []),
  },
  subscriptionKey: {
    validate: vi.fn(async () => ({ valid: true as const })),
    getStatus: vi.fn(async () => null),
    clear: vi.fn(async () => {}),
  },
  chat: {
    send: vi.fn(async () => ''),
    abort: vi.fn(() => {}),
    onToken: vi.fn(() => () => {}),
    onToolStart: vi.fn(() => () => {}),
    onToolEnd: vi.fn(() => () => {}),
    onAssistantComplete: vi.fn(() => () => {}),
    onError: vi.fn(() => () => {}),
    onDone: vi.fn(() => () => {}),
  },
}
