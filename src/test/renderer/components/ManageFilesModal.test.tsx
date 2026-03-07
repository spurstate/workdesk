import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ManageFilesModal from '../../../renderer/components/Files/ManageFilesModal'
import { mockWindowApi } from '../../mocks/window-api'

describe('ManageFilesModal', () => {
  const contextFiles = [
    { name: 'school.md', path: '/ws/context/school.md', isDirectory: false },
  ]
  const curriculumFiles = [
    { name: 'maths.pdf', path: '/ws/curriculum/maths.pdf', isDirectory: false },
  ]

  beforeEach(() => {
    mockWindowApi.workspace.listContextFiles.mockResolvedValue([
      {
        name: 'context',
        path: '/ws/context',
        isDirectory: true,
        children: contextFiles,
      },
    ])
    mockWindowApi.curriculum.listFiles.mockResolvedValue(curriculumFiles)
  })

  it('renders the modal heading', async () => {
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Manage Files')).toBeTruthy())
  })

  it('shows context files tab by default', async () => {
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('school.md')).toBeTruthy())
  })

  it('shows curriculum files when Curriculum tab is clicked', async () => {
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    const curriculumTab = await screen.findByText('Curriculum')
    await user.click(curriculumTab)
    await waitFor(() => expect(screen.getByText('maths.pdf')).toBeTruthy())
  })

  it('calls onClose when X button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={onClose} />)
    // The X close button
    const closeBtn = await screen.findByTitle('Close')
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows preview when a file is clicked', async () => {
    mockWindowApi.workspace.readFile.mockResolvedValue('# School info content')
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    const fileBtn = await screen.findByText('school.md')
    await user.click(fileBtn)
    await waitFor(() => expect(screen.getByText(/school info content/i)).toBeTruthy())
  })

  it('shows back button in preview and returns to file list', async () => {
    mockWindowApi.workspace.readFile.mockResolvedValue('Preview content')
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await user.click(await screen.findByText('school.md'))
    await waitFor(() => expect(screen.getByText(/preview content/i)).toBeTruthy())
    await user.click(screen.getByText('← Back'))
    await waitFor(() => expect(screen.getByText('school.md')).toBeTruthy())
  })

  it('calls files.export when Export Context Files is clicked', async () => {
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await screen.findByText('school.md')
    await user.click(screen.getByText('Export Context Files'))
    expect(mockWindowApi.files.export).toHaveBeenCalledWith(['/ws/context/school.md'])
  })

  it('calls curriculum.importFile when Import File is clicked', async () => {
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await user.click(await screen.findByText('Curriculum'))
    await user.click(await screen.findByText('Import File'))
    expect(mockWindowApi.curriculum.importFile).toHaveBeenCalled()
  })

  it('calls curriculum.deleteFile when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await user.click(await screen.findByText('Curriculum'))
    await screen.findByText('maths.pdf')
    await user.click(screen.getByTitle('Delete'))
    expect(mockWindowApi.curriculum.deleteFile).toHaveBeenCalledWith('/ws/curriculum/maths.pdf')
  })

  it('calls files.export when Export All is clicked in Curriculum tab', async () => {
    const user = userEvent.setup()
    render(<ManageFilesModal workspacePath="/ws" onClose={vi.fn()} />)
    await user.click(await screen.findByText('Curriculum'))
    await screen.findByText('maths.pdf')
    await user.click(screen.getByText('Export All'))
    expect(mockWindowApi.files.export).toHaveBeenCalledWith(['/ws/curriculum/maths.pdf'])
  })
})
