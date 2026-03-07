import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConfig } from '../../../renderer/hooks/useConfig'
import { mockWindowApi } from '../../mocks/window-api'

describe('useConfig', () => {
  it('starts in loading state', () => {
    mockWindowApi.config.getKeyStatus.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useConfig())
    expect(result.current.loading).toBe(true)
    expect(result.current.hasKey).toBe(false)
  })

  it('sets hasKey=true when API key exists', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(true)
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasKey).toBe(true)
  })

  it('sets hasKey=false when no API key', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(false)
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasKey).toBe(false)
  })

  it('setKey calls API and sets hasKey=true', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(false)
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.setKey('sk-new')
    })
    expect(mockWindowApi.config.setKey).toHaveBeenCalledWith('sk-new')
    expect(result.current.hasKey).toBe(true)
  })

  it('clearKey calls API and sets hasKey=false', async () => {
    mockWindowApi.config.getKeyStatus.mockResolvedValue(true)
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.clearKey()
    })
    expect(mockWindowApi.config.clearKey).toHaveBeenCalled()
    expect(result.current.hasKey).toBe(false)
  })
})
