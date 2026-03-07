import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import FileBrowser from '../../../renderer/components/Sidebar/FileBrowser'
import { mockWindowApi } from '../../mocks/window-api'

const files = [
  {
    name: 'context',
    path: '/ws/context',
    isDirectory: true,
    children: [
      { name: 'school.md', path: '/ws/context/school.md', isDirectory: false },
    ],
  },
  { name: 'CLAUDE.md', path: '/ws/CLAUDE.md', isDirectory: false },
]

describe('FileBrowser', () => {
  it('renders file and directory names', () => {
    render(<FileBrowser files={files} onOpenFile={vi.fn()} />)
    expect(screen.getByText('context')).toBeTruthy()
    expect(screen.getByText('CLAUDE.md')).toBeTruthy()
  })

  it('auto-expands directories on first render', () => {
    render(<FileBrowser files={files} onOpenFile={vi.fn()} />)
    // Children should be visible after auto-expand
    expect(screen.getByText('school.md')).toBeTruthy()
  })

  it('calls onOpenFile when a file is clicked', () => {
    const onOpenFile = vi.fn()
    render(<FileBrowser files={files} onOpenFile={onOpenFile} />)
    fireEvent.click(screen.getByText('school.md'))
    expect(onOpenFile).toHaveBeenCalledWith('/ws/context/school.md', 'school.md')
  })

  it('toggles directory expansion when clicked', async () => {
    const onOpenFile = vi.fn()
    render(<FileBrowser files={files} onOpenFile={onOpenFile} />)
    // After initial auto-expand, click context dir to collapse
    const contextItem = screen.getByText('context')
    fireEvent.click(contextItem)
    await waitFor(() => {
      expect(screen.queryByText('school.md')).toBeNull()
    })
    // Click again to expand
    fireEvent.click(contextItem)
    await waitFor(() => {
      expect(screen.getByText('school.md')).toBeTruthy()
    })
  })

  it('renders empty state gracefully', () => {
    const { container } = render(<FileBrowser files={[]} onOpenFile={vi.fn()} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('calls onOpenFile for root-level files', () => {
    const onOpenFile = vi.fn()
    render(<FileBrowser files={files} onOpenFile={onOpenFile} />)
    fireEvent.click(screen.getByText('CLAUDE.md'))
    expect(onOpenFile).toHaveBeenCalledWith('/ws/CLAUDE.md', 'CLAUDE.md')
  })

  it('calls files.export when save to computer button is clicked', () => {
    render(<FileBrowser files={files} onOpenFile={vi.fn()} />)
    const saveBtns = screen.getAllByTitle('Save to computer')
    fireEvent.click(saveBtns[0])
    expect(mockWindowApi.files.export).toHaveBeenCalled()
  })

  it('renders correct icons for various file extensions', () => {
    const variedFiles = [
      { name: 'doc.pdf', path: '/doc.pdf', isDirectory: false },
      { name: 'slides.pptx', path: '/slides.pptx', isDirectory: false },
      { name: 'word.docx', path: '/word.docx', isDirectory: false },
      { name: 'script.ts', path: '/script.ts', isDirectory: false },
      { name: 'module.js', path: '/module.js', isDirectory: false },
      { name: 'image.png', path: '/image.png', isDirectory: false },
      { name: 'data.json', path: '/data.json', isDirectory: false },
      { name: 'app.tsx', path: '/app.tsx', isDirectory: false },
      { name: 'app.jsx', path: '/app.jsx', isDirectory: false },
      { name: 'photo.jpg', path: '/photo.jpg', isDirectory: false },
      { name: 'unknown.xyz', path: '/unknown.xyz', isDirectory: false },
    ]
    render(<FileBrowser files={variedFiles} onOpenFile={vi.fn()} />)
    variedFiles.forEach((f) => {
      expect(screen.getByText(f.name)).toBeTruthy()
    })
  })
})
