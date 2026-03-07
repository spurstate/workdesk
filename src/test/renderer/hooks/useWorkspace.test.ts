import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWorkspace } from '../../../renderer/hooks/useWorkspace'
import { mockWindowApi } from '../../mocks/window-api'

describe('useWorkspace', () => {
  it('fetches workspace path and files on mount', async () => {
    mockWindowApi.workspace.getCurrent.mockResolvedValue('/test/workspace')
    mockWindowApi.workspace.listFiles.mockResolvedValue([
      { name: 'context', path: '/test/workspace/context', isDirectory: true },
    ])
    const { result } = renderHook(() => useWorkspace())
    await waitFor(() => expect(result.current.workspacePath).toBe('/test/workspace'))
    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].name).toBe('context')
  })

  it('subscribes to workspace file change events and unsubscribes on unmount', () => {
    const unsub = vi.fn()
    mockWindowApi.workspace.onFilesChanged.mockReturnValue(unsub)
    const { unmount } = renderHook(() => useWorkspace())
    expect(mockWindowApi.workspace.onFilesChanged).toHaveBeenCalled()
    unmount()
    expect(unsub).toHaveBeenCalled()
  })

  it('updates files when onFilesChanged fires', async () => {
    let fileChangeCallback: ((files: unknown[]) => void) | null = null
    mockWindowApi.workspace.onFilesChanged.mockImplementation((cb) => {
      fileChangeCallback = cb
      return vi.fn()
    })
    mockWindowApi.workspace.getCurrent.mockResolvedValue('/ws')
    mockWindowApi.workspace.listFiles.mockResolvedValue([])
    const { result } = renderHook(() => useWorkspace())
    await waitFor(() => expect(mockWindowApi.workspace.onFilesChanged).toHaveBeenCalled())
    const newFiles = [{ name: 'new.md', path: '/ws/new.md', isDirectory: false }]
    fileChangeCallback!(newFiles)
    await waitFor(() => expect(result.current.files).toEqual(newFiles))
  })
})
