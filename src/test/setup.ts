import { vi, beforeEach } from 'vitest'
import { mockWindowApi } from './mocks/window-api'

// Only set up window.api in browser-like environments (happy-dom).
// Node-environment tests (// @vitest-environment node) don't have window.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'api', {
    value: mockWindowApi,
    writable: true,
  })
}

// Reset all mock functions between tests so they don't bleed state
beforeEach(() => {
  vi.clearAllMocks()
  if (typeof window === 'undefined') return
  // Re-apply defaults after clearing
  mockWindowApi.config.getKeyStatus.mockResolvedValue(false)
  mockWindowApi.config.getModel.mockResolvedValue('claude-haiku-4-5-20251001')
  mockWindowApi.output.listFiles.mockResolvedValue([])
  mockWindowApi.output.onFilesChanged.mockReturnValue(() => {})
  mockWindowApi.workspace.getCurrent.mockResolvedValue('/test/workspace')
  mockWindowApi.workspace.listFiles.mockResolvedValue([])
  mockWindowApi.workspace.readFile.mockResolvedValue('')
  mockWindowApi.workspace.onFilesChanged.mockReturnValue(() => {})
  mockWindowApi.workspace.listContextFiles.mockResolvedValue([])
  mockWindowApi.workspace.onContextChanged.mockReturnValue(() => {})
  mockWindowApi.session.list.mockResolvedValue([])
  mockWindowApi.session.loadMessages.mockResolvedValue([])
  mockWindowApi.subscriptionKey.getStatus.mockResolvedValue(null)
  mockWindowApi.subscriptionKey.validate.mockResolvedValue({ valid: true })
  mockWindowApi.chat.send.mockResolvedValue('')
  mockWindowApi.chat.onToken.mockReturnValue(() => {})
  mockWindowApi.chat.onToolStart.mockReturnValue(() => {})
  mockWindowApi.chat.onToolEnd.mockReturnValue(() => {})
  mockWindowApi.chat.onAssistantComplete.mockReturnValue(() => {})
  mockWindowApi.chat.onError.mockReturnValue(() => {})
  mockWindowApi.chat.onDone.mockReturnValue(() => {})
})
