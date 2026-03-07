// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock config-service dependencies
const mockGetSubscriptionKey = vi.fn<() => string | null>()
const mockGetSubscriptionKeyCache = vi.fn()
const mockSetSubscriptionKeyCache = vi.fn()

vi.mock('../../main/config-service', () => ({
  getSubscriptionKey: mockGetSubscriptionKey,
  getSubscriptionKeyCache: mockGetSubscriptionKeyCache,
  setSubscriptionKeyCache: mockSetSubscriptionKeyCache,
}))

// Import after mocks
const { validateSubscriptionKey, checkSubscriptionKeyOnStartup } =
  await import('../../main/subscription-key-service')

function makeFetchResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response
}

describe('validateSubscriptionKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns invalid when server returns 400', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => makeFetchResponse(400, {})))
    const result = await validateSubscriptionKey('SBK-bad')
    expect(result.valid).toBe(false)
    expect((result as { valid: false; message: string }).message).toMatch(/No account found/i)
  })

  it('returns valid when server returns validKey: true', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => makeFetchResponse(200, { validKey: true })))
    const result = await validateSubscriptionKey('SBK-good')
    expect(result.valid).toBe(true)
  })

  it('returns invalid when server returns validKey: false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => makeFetchResponse(200, { validKey: false })))
    const result = await validateSubscriptionKey('SBK-expired')
    expect(result.valid).toBe(false)
    expect((result as { valid: false; message: string }).message).toMatch(/expired/i)
  })

  it('throws on unexpected status codes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => makeFetchResponse(500, {})))
    await expect(validateSubscriptionKey('SBK-x')).rejects.toThrow('Unexpected response')
  })
})

describe('checkSubscriptionKeyOnStartup', () => {
  const NOW = 1_000_000_000_000
  const WITHIN_TTL = NOW - 1 * 60 * 60 * 1000 // 1 hour ago (within 24h)
  const OUTSIDE_TTL_WITHIN_GRACE = NOW - 2 * 24 * 60 * 60 * 1000 // 2 days ago
  const OUTSIDE_GRACE = NOW - 8 * 24 * 60 * 60 * 1000 // 8 days ago

  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(NOW)
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns cached result if within 24h TTL (no fetch)', async () => {
    const cache = { valid: true as const, checkedAt: WITHIN_TTL, subscriptionKey: 'SBK-cached' }
    mockGetSubscriptionKeyCache.mockReturnValue(cache)
    const result = await checkSubscriptionKeyOnStartup()
    expect(result).toMatchObject({ valid: true, storedKey: 'SBK-cached' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns invalid when no stored key and cache expired', async () => {
    mockGetSubscriptionKeyCache.mockReturnValue(null)
    mockGetSubscriptionKey.mockReturnValue(null)
    const result = await checkSubscriptionKeyOnStartup()
    expect(result).toMatchObject({ valid: false })
  })

  it('returns valid and caches result on successful network validation', async () => {
    mockGetSubscriptionKeyCache.mockReturnValue(null)
    mockGetSubscriptionKey.mockReturnValue('SBK-live')
    vi.stubGlobal('fetch', vi.fn(async () => makeFetchResponse(200, { validKey: true })))
    const result = await checkSubscriptionKeyOnStartup()
    expect(result).toMatchObject({ valid: true, storedKey: 'SBK-live' })
    expect(mockSetSubscriptionKeyCache).toHaveBeenCalledWith(
      expect.objectContaining({ valid: true, subscriptionKey: 'SBK-live' })
    )
  })

  it('returns invalid from network when validKey is false', async () => {
    mockGetSubscriptionKeyCache.mockReturnValue(null)
    mockGetSubscriptionKey.mockReturnValue('SBK-expired')
    vi.stubGlobal('fetch', vi.fn(async () => makeFetchResponse(200, { validKey: false })))
    const result = await checkSubscriptionKeyOnStartup()
    expect(result).toMatchObject({ valid: false, storedKey: 'SBK-expired' })
  })

  it('returns offline-valid when network fails but grace period cache exists', async () => {
    const cache = { valid: true as const, checkedAt: OUTSIDE_TTL_WITHIN_GRACE, subscriptionKey: 'SBK-grace' }
    mockGetSubscriptionKeyCache.mockReturnValue(cache)
    mockGetSubscriptionKey.mockReturnValue('SBK-grace')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error') }))
    const result = await checkSubscriptionKeyOnStartup()
    expect(result).toMatchObject({ valid: true, offline: true, storedKey: 'SBK-grace' })
  })

  it('returns invalid when network fails and grace period has expired', async () => {
    const cache = { valid: true as const, checkedAt: OUTSIDE_GRACE, subscriptionKey: 'SBK-old' }
    mockGetSubscriptionKeyCache.mockReturnValue(cache)
    mockGetSubscriptionKey.mockReturnValue('SBK-old')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error') }))
    const result = await checkSubscriptionKeyOnStartup()
    expect(result).toMatchObject({ valid: false })
  })
})
