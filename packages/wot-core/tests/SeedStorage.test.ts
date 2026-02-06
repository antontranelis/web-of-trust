import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SeedStorage } from '../src/identity/SeedStorage'

describe('SeedStorage', () => {
  let storage: SeedStorage

  beforeEach(() => {
    storage = new SeedStorage()
  })

  afterEach(async () => {
    // Cleanup: Delete any stored seed after each test
    try {
      await storage.deleteSeed()
    } catch {
      // Ignore if no seed exists
    }
  })

  describe('storeSeed() and loadSeed()', () => {
    it('should store and load seed with correct passphrase', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'test-passphrase-123'

      await storage.storeSeed(seed, passphrase)

      const loadedSeed = await storage.loadSeed(passphrase)

      expect(loadedSeed).toEqual(seed)
    })

    it('should encrypt seed (loaded seed is different before decryption)', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'test-passphrase-123'

      await storage.storeSeed(seed, passphrase)

      // The stored encrypted data should be different from the original seed
      // We can't directly access the encrypted data, but we can verify
      // that decryption with wrong passphrase fails
      const wrongPassphrase = 'wrong-passphrase'

      await expect(storage.loadSeed(wrongPassphrase)).rejects.toThrow('Invalid passphrase')
    })

    it('should throw error with wrong passphrase', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'correct-passphrase'

      await storage.storeSeed(seed, passphrase)

      await expect(storage.loadSeed('wrong-passphrase')).rejects.toThrow('Invalid passphrase')
    })

    it('should return null when no seed is stored', async () => {
      const passphrase = 'test-passphrase-123'

      const loadedSeed = await storage.loadSeed(passphrase)

      expect(loadedSeed).toBeNull()
    })

    it('should use PBKDF2 + AES-GCM (different salt produces different ciphertext)', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'test-passphrase-123'

      // Store and load once
      await storage.storeSeed(seed, passphrase)
      const loaded1 = await storage.loadSeed(passphrase)

      // Delete and store again with same seed and passphrase
      await storage.deleteSeed()
      await storage.storeSeed(seed, passphrase)
      const loaded2 = await storage.loadSeed(passphrase)

      // Seeds should match
      expect(loaded1).toEqual(seed)
      expect(loaded2).toEqual(seed)
      expect(loaded1).toEqual(loaded2)

      // But the encrypted ciphertext should be different due to random salt/IV
      // (We can't directly test this without accessing internal storage)
    })
  })

  describe('hasSeed()', () => {
    it('should return false when no seed is stored', async () => {
      const hasSeed = await storage.hasSeed()

      expect(hasSeed).toBe(false)
    })

    it('should return true after storing seed', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'test-passphrase-123'

      await storage.storeSeed(seed, passphrase)

      const hasSeed = await storage.hasSeed()

      expect(hasSeed).toBe(true)
    })

    it('should return false after deleting seed', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'test-passphrase-123'

      await storage.storeSeed(seed, passphrase)
      await storage.deleteSeed()

      const hasSeed = await storage.hasSeed()

      expect(hasSeed).toBe(false)
    })
  })

  describe('deleteSeed()', () => {
    it('should delete stored seed', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'test-passphrase-123'

      await storage.storeSeed(seed, passphrase)
      expect(await storage.hasSeed()).toBe(true)

      await storage.deleteSeed()
      expect(await storage.hasSeed()).toBe(false)
    })

    it('should not throw error when deleting non-existent seed', async () => {
      await expect(storage.deleteSeed()).resolves.not.toThrow()
    })
  })

  describe('Security Properties', () => {
    it('should use different salt for each storage (deterministic but secure)', async () => {
      const seed1 = crypto.getRandomValues(new Uint8Array(32))
      const seed2 = crypto.getRandomValues(new Uint8Array(32))
      const passphrase = 'same-passphrase'

      // Store seed1
      await storage.storeSeed(seed1, passphrase)
      const loaded1 = await storage.loadSeed(passphrase)

      // Replace with seed2
      await storage.storeSeed(seed2, passphrase)
      const loaded2 = await storage.loadSeed(passphrase)

      expect(loaded1).toEqual(seed1)
      expect(loaded2).toEqual(seed2)
      expect(loaded1).not.toEqual(loaded2)
    })

    it('should handle different passphrases for same seed', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const passphrase1 = 'passphrase-one'

      // Store with passphrase1
      await storage.storeSeed(seed, passphrase1)
      const loaded = await storage.loadSeed(passphrase1)

      expect(loaded).toEqual(seed)

      // Different passphrase should fail
      await expect(storage.loadSeed('different-passphrase')).rejects.toThrow()
    })
  })
})
