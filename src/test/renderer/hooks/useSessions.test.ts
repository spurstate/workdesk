import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessions } from '../../../renderer/hooks/useSessions'
import { mockWindowApi } from '../../mocks/window-api'

describe('useSessions', () => {
  it('starts with empty sessions and not loading', () => {
    const { result } = renderHook(() => useSessions())
    expect(result.current.sessions).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('')
  })

  it('refresh loads sessions from API', async () => {
    const sessions = [{ id: 's1', timestamp: 1000, preview: 'Lesson plan' }]
    mockWindowApi.session.list.mockResolvedValue(sessions)
    const { result } = renderHook(() => useSessions())
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.sessions).toEqual(sessions)
    expect(result.current.loading).toBe(false)
  })

  it('sets error on API failure', async () => {
    mockWindowApi.session.list.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useSessions())
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.error).toBe('Network error')
    expect(result.current.loading).toBe(false)
  })

  it('sets generic error message for non-Error rejections', async () => {
    mockWindowApi.session.list.mockRejectedValueOnce('string error')
    const { result } = renderHook(() => useSessions())
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.error).toBe('Failed to load sessions')
  })
})
