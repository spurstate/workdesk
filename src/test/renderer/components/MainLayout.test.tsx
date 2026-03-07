import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { mockWindowApi } from '../../mocks/window-api'

// Mock heavy sub-components so we can test MainLayout's shell in isolation
vi.mock('../../../renderer/assets/logo.png', () => ({ default: 'logo.png' }))
vi.mock('../../../renderer/components/Chat/ChatView', () => ({
  default: ({ onSend }: { onSend: (m: string) => void }) => (
    <div data-testid="chat-view"><button onClick={() => onSend('test')}>Send</button></div>
  ),
}))
vi.mock('../../../renderer/components/Commands/CommandPanel', () => ({
  default: ({ onSubmit }: { onSubmit: (prompt: string, label?: string) => void }) => (
    <div data-testid="command-panel">
      <button onClick={() => onSubmit('test prompt', 'Test')}>Run Command</button>
    </div>
  ),
}))
vi.mock('../../../renderer/components/Sidebar/FileBrowser', () => ({
  default: ({ onOpenFile }: { onOpenFile: (path: string, name: string) => void }) => (
    <div data-testid="file-browser">
      <button onClick={() => onOpenFile('/test/file.md', 'file.md')}>Open File</button>
    </div>
  ),
}))
vi.mock('../../../renderer/components/Sidebar/FilePreviewModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="preview-modal"><button onClick={onClose}>Close</button></div>
  ),
}))
vi.mock('../../../renderer/components/Sidebar/SessionList', () => ({
  default: ({ onResume }: { onResume: (id: string) => void }) => (
    <div data-testid="session-list">
      <button onClick={() => onResume('session-abc')}>Resume</button>
    </div>
  ),
}))
vi.mock('../../../renderer/components/Files/ManageFilesModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="manage-files-modal"><button onClick={onClose}>Close</button></div>
  ),
}))
vi.mock('../../../renderer/components/HowToUseModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="how-to-use-modal"><button onClick={onClose}>Close</button></div>
  ),
}))

import MainLayout from '../../../renderer/components/MainLayout'

const defaultProps = {
  workspacePath: '/test/workspace',
  hasKey: true,
  onOpenSettings: vi.fn(),
  onUpdateContext: vi.fn(),
}

describe('MainLayout', () => {
  it('renders the chat view', async () => {
    render(<MainLayout {...defaultProps} />)
    await waitFor(() => expect(screen.getByTestId('chat-view')).toBeTruthy())
  })

  it('renders the file browser by default', async () => {
    mockWindowApi.output.listFiles.mockResolvedValue([
      { name: 'file.md', path: '/out/file.md', isDirectory: false },
    ])
    render(<MainLayout {...defaultProps} />)
    await waitFor(() => expect(screen.getByTestId('file-browser')).toBeTruthy())
  })

  it('calls onOpenSettings when settings button is clicked', async () => {
    const onOpenSettings = vi.fn()
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} onOpenSettings={onOpenSettings} />)
    const settingsBtn = await screen.findByTestId('settings-btn')
    await user.click(settingsBtn)
    expect(onOpenSettings).toHaveBeenCalled()
  })

  it('shows HowToUseModal when "How to use" is clicked', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    const helpBtns = await screen.findAllByTitle(/how to use/i)
    await user.click(helpBtns[0])
    expect(screen.getByTestId('how-to-use-modal')).toBeTruthy()
  })

  it('shows sessions tab when Sessions is clicked', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    const sessionBtn = await screen.findByText('Sessions')
    await user.click(sessionBtn)
    expect(screen.getByTestId('session-list')).toBeTruthy()
  })

  it('loads output files on mount', async () => {
    mockWindowApi.output.listFiles.mockResolvedValue([
      { name: 'report.md', path: '/ws/outputs/report.md', isDirectory: false },
    ])
    render(<MainLayout {...defaultProps} />)
    await waitFor(() => expect(mockWindowApi.output.listFiles).toHaveBeenCalled())
  })

  it('triggers auto greeting when hasKey is true', async () => {
    render(<MainLayout {...defaultProps} hasKey />)
    await waitFor(() => expect(mockWindowApi.chat.send).toHaveBeenCalled())
  })

  it('toggles command panel when Tasks button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    const toggle = await screen.findByTestId('cmd-toggle')
    await user.click(toggle)
    expect(screen.getByTestId('command-panel')).toBeTruthy()
    await user.click(toggle)
    expect(screen.queryByTestId('command-panel')).toBeNull()
  })

  it('submits command from command panel and closes panel', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click(await screen.findByTestId('cmd-toggle'))
    await user.click(screen.getByText('Run Command'))
    await waitFor(() => expect(mockWindowApi.chat.send).toHaveBeenCalled())
    expect(screen.queryByTestId('command-panel')).toBeNull()
  })

  it('opens ManageFilesModal when Manage Files is clicked', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click(await screen.findByTestId('manage-files-btn'))
    expect(screen.getByTestId('manage-files-modal')).toBeTruthy()
  })

  it('closes ManageFilesModal when its close button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click(await screen.findByTestId('manage-files-btn'))
    await user.click(screen.getByTestId('manage-files-modal').querySelector('button')!)
    await waitFor(() => expect(screen.queryByTestId('manage-files-modal')).toBeNull())
  })

  it('closes HowToUseModal when its close button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click((await screen.findAllByTitle(/how to use/i))[0])
    await user.click(screen.getByTestId('how-to-use-modal').querySelector('button')!)
    await waitFor(() => expect(screen.queryByTestId('how-to-use-modal')).toBeNull())
  })

  it('exports output files when save to computer is clicked', async () => {
    mockWindowApi.output.listFiles.mockResolvedValue([
      { name: 'report.md', path: '/out/report.md', isDirectory: false },
    ])
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    const saveBtn = await screen.findByText('Save to computer')
    await user.click(saveBtn)
    expect(mockWindowApi.files.export).toHaveBeenCalledWith(['/out/report.md'])
  })

  it('opens file preview when file is clicked in browser', async () => {
    mockWindowApi.output.listFiles.mockResolvedValue([
      { name: 'file.md', path: '/out/file.md', isDirectory: false },
    ])
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click(await screen.findByText('Open File'))
    expect(screen.getByTestId('preview-modal')).toBeTruthy()
  })

  it('closes file preview modal when close is clicked', async () => {
    mockWindowApi.output.listFiles.mockResolvedValue([
      { name: 'file.md', path: '/out/file.md', isDirectory: false },
    ])
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click(await screen.findByText('Open File'))
    await user.click(screen.getByTestId('preview-modal').querySelector('button')!)
    await waitFor(() => expect(screen.queryByTestId('preview-modal')).toBeNull())
  })

  it('resumes a session from the sessions tab', async () => {
    mockWindowApi.session.loadMessages.mockResolvedValue([
      { role: 'user', content: 'Hello' },
    ])
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} />)
    await user.click(await screen.findByText('Sessions'))
    await user.click(screen.getByText('Resume'))
    await waitFor(() =>
      expect(mockWindowApi.session.loadMessages).toHaveBeenCalledWith('session-abc')
    )
  })

  it('calls onUpdateContext when Update Context is clicked', async () => {
    const onUpdateContext = vi.fn()
    const user = userEvent.setup()
    render(<MainLayout {...defaultProps} onUpdateContext={onUpdateContext} />)
    await user.click(await screen.findByTestId('update-context-btn'))
    expect(onUpdateContext).toHaveBeenCalled()
  })
})
