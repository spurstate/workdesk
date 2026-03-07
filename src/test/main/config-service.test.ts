// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron-store with an in-memory Map
vi.mock('electron-store', () => ({
  default: class MockStore {
    private data: Map<string, unknown> = new Map()
    get<T>(key: string): T | undefined { return this.data.get(key) as T | undefined }
    set(key: string, value: unknown): void { this.data.set(key, value) }
    delete(key: string): void { this.data.delete(key) }
  },
}))

const mockSafeStorage = {
  isEncryptionAvailable: vi.fn(() => true),
  encryptString: vi.fn((s: string) => Buffer.from(s, 'utf8')),
  decryptString: vi.fn((b: Buffer) => b.toString('utf8')),
}

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-workspace'),
    isPackaged: false,
  },
  safeStorage: mockSafeStorage,
}))

// Import after mocks are registered
const {
  hasApiKey,
  setApiKey,
  getApiKey,
  clearApiKey,
  getModel,
  setModel,
  getSubscriptionKey,
  setSubscriptionKey,
  clearSubscriptionKey,
  getSubscriptionKeyCache,
  setSubscriptionKeyCache,
  migrateLegacyConfig,
} = await import('../../main/config-service')

describe('config-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
    mockSafeStorage.encryptString.mockImplementation((s: string) => Buffer.from(s, 'utf8'))
    mockSafeStorage.decryptString.mockImplementation((b: Buffer) => b.toString('utf8'))
  })

  describe('API key (with encryption)', () => {
    it('returns null when no key is stored', () => {
      expect(getApiKey()).toBeNull()
    })

    it('hasApiKey returns false when no key stored', () => {
      expect(hasApiKey()).toBe(false)
    })

    it('round-trips API key through encryption', () => {
      setApiKey('sk-test-key')
      expect(mockSafeStorage.encryptString).toHaveBeenCalledWith('sk-test-key')
      const result = getApiKey()
      expect(result).toBe('sk-test-key')
    })

    it('hasApiKey returns true after key is set', () => {
      setApiKey('sk-test-key')
      expect(hasApiKey()).toBe(true)
    })

    it('clearApiKey removes stored key', () => {
      setApiKey('sk-test-key')
      clearApiKey()
      expect(getApiKey()).toBeNull()
      expect(hasApiKey()).toBe(false)
    })

    it('uses base64 fallback when safeStorage unavailable', () => {
      mockSafeStorage.isEncryptionAvailable.mockReturnValue(false)
      setApiKey('my-key')
      // Should not call encryptString when unavailable
      expect(mockSafeStorage.encryptString).not.toHaveBeenCalled()
      // getApiKey with unavailable decryption should decode base64
      mockSafeStorage.isEncryptionAvailable.mockReturnValue(false)
      const result = getApiKey()
      expect(result).toBe('my-key')
    })

    it('returns null when decryption throws', () => {
      setApiKey('sk-key')
      mockSafeStorage.decryptString.mockImplementation(() => { throw new Error('decrypt fail') })
      expect(getApiKey()).toBeNull()
    })
  })

  describe('model', () => {
    it('returns default model when not set', () => {
      expect(getModel()).toBe('claude-haiku-4-5-20251001')
    })

    it('round-trips model setting', () => {
      setModel('claude-opus-4-6')
      expect(getModel()).toBe('claude-opus-4-6')
    })
  })

  describe('subscription key', () => {
    it('returns null when not set', () => {
      expect(getSubscriptionKey()).toBeNull()
    })

    it('round-trips subscription key', () => {
      setSubscriptionKey('SBK-test-key-123')
      expect(getSubscriptionKey()).toBe('SBK-test-key-123')
    })

    it('clearSubscriptionKey removes key and cache', () => {
      setSubscriptionKey('SBK-test')
      setSubscriptionKeyCache({ valid: true, checkedAt: Date.now(), subscriptionKey: 'SBK-test' })
      clearSubscriptionKey()
      expect(getSubscriptionKey()).toBeNull()
      expect(getSubscriptionKeyCache()).toBeNull()
    })
  })

  describe('subscription key cache', () => {
    it('returns null when no cache', () => {
      expect(getSubscriptionKeyCache()).toBeNull()
    })

    it('round-trips cache object', () => {
      const cache = { valid: true as const, checkedAt: 1000, subscriptionKey: 'SBK-x' }
      setSubscriptionKeyCache(cache)
      expect(getSubscriptionKeyCache()).toEqual(cache)
    })
  })

  describe('migrateLegacyConfig', () => {
    it('runs without error', () => {
      // Just ensure it doesn't throw; legacy keys may or may not exist
      expect(() => migrateLegacyConfig()).not.toThrow()
    })
  })
})
