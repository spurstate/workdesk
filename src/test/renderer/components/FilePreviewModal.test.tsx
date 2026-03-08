import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import FilePreviewModal from '../../../renderer/components/Sidebar/FilePreviewModal'
import { mockWindowApi } from '../../mocks/window-api'

describe('FilePreviewModal', () => {
  it('shows loading state initially', () => {
    mockWindowApi.workspace.readFile.mockReturnValue(new Promise(() => {}))
    render(<FilePreviewModal filePath="/ws/file.md" fileName="file.md" onClose={vi.fn()} />)
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('renders file name in header', () => {
    mockWindowApi.workspace.readFile.mockResolvedValue('# Content')
    render(<FilePreviewModal filePath="/ws/file.md" fileName="my-file.md" onClose={vi.fn()} />)
    expect(screen.getByText('my-file.md')).toBeTruthy()
  })

  it('renders file content after load', async () => {
    mockWindowApi.workspace.readFile.mockResolvedValue('Hello world content')
    render(<FilePreviewModal filePath="/ws/file.md" fileName="file.md" onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Hello world content')).toBeTruthy())
  })

  it('shows error when file read fails', async () => {
    mockWindowApi.workspace.readFile.mockRejectedValueOnce(new Error('Permission denied'))
    render(<FilePreviewModal filePath="/ws/file.md" fileName="file.md" onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/could not read file/i)).toBeTruthy())
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    mockWindowApi.workspace.readFile.mockResolvedValue('content')
    render(<FilePreviewModal filePath="/ws/file.md" fileName="file.md" onClose={onClose} />)
    // The X button
    const buttons = screen.getAllByRole('button')
    const closeBtn = buttons[buttons.length - 1]
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn()
    mockWindowApi.workspace.readFile.mockResolvedValue('content')
    render(<FilePreviewModal filePath="/ws/file.md" fileName="file.md" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked (mousedown then click on backdrop)', async () => {
    const onClose = vi.fn()
    mockWindowApi.workspace.readFile.mockResolvedValue('content')
    const { container } = render(
      <FilePreviewModal filePath="/ws/file.md" fileName="file.md" onClose={onClose} />
    )
    // Both mousedown and click must originate on the backdrop for it to close
    const backdrop = container.firstChild as HTMLElement
    fireEvent.mouseDown(backdrop)
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })
})
