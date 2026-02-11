import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WotIdentity } from '../src/identity/WotIdentity'
import { verifyJws } from '../src/crypto/jws'

describe('WotIdentity', () => {
  let identity: WotIdentity

  beforeEach(() => {
    identity = new WotIdentity()
  })

  afterEach(async () => {
    // Cleanup: Delete any stored identity after each test
    try {
      await identity.deleteStoredIdentity()
    } catch {
      // Ignore if no identity exists
    }
  })

  describe('create()', () => {
    it('should create a new identity with 12-word mnemonic', async () => {
      const passphrase = 'test-passphrase-123'
      const result = await identity.create(passphrase, false) // Don't store seed

      expect(result.mnemonic).toBeDefined()
      expect(result.did).toBeDefined()

      // Verify mnemonic is 12 words
      const words = result.mnemonic.split(' ')
      expect(words.length).toBe(12)
      expect(words.every((word) => word.length > 0)).toBe(true)
    })

    it('should generate a valid did:key format', async () => {
      const passphrase = 'test-passphrase-123'
      const result = await identity.create(passphrase, false)

      expect(result.did).toMatch(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/)
    })

    it('should store encrypted seed when storeSeed=true', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, true)

      const hasSeed = await identity.hasStoredIdentity()
      expect(hasSeed).toBe(true)
    })

    it('should not store seed when storeSeed=false', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, false)

      const hasSeed = await identity.hasStoredIdentity()
      expect(hasSeed).toBe(false)
    })
  })

  describe('unlock()', () => {
    it('should unlock identity from mnemonic and passphrase', async () => {
      const passphrase = 'test-passphrase-123'
      const result = await identity.create(passphrase, false)

      // Create new identity instance and unlock with mnemonic
      const identity2 = new WotIdentity()
      await identity2.unlock(result.mnemonic, passphrase)

      const did2 = identity2.getDid()
      expect(did2).toBe(result.did)
    })

    it('should be deterministic - same mnemonic produces same DID', async () => {
      const passphrase = 'test-passphrase-123'
      const result = await identity.create(passphrase, false)

      // Unlock multiple times with same mnemonic
      const identity2 = new WotIdentity()
      await identity2.unlock(result.mnemonic, passphrase)

      const identity3 = new WotIdentity()
      await identity3.unlock(result.mnemonic, passphrase)

      expect(identity2.getDid()).toBe(result.did)
      expect(identity3.getDid()).toBe(result.did)
      expect(identity2.getDid()).toBe(identity3.getDid())
    })

    it('should throw error on invalid mnemonic', async () => {
      const invalidMnemonic = 'invalid words that are not a valid mnemonic phrase at all'
      const passphrase = 'test-passphrase-123'

      await expect(identity.unlock(invalidMnemonic, passphrase)).rejects.toThrow(
        'Invalid mnemonic'
      )
    })
  })

  describe('unlockFromStorage()', () => {
    it('should unlock identity from stored encrypted seed', async () => {
      const passphrase = 'test-passphrase-123'
      const result = await identity.create(passphrase, true)

      // Create new identity instance and unlock from storage
      const identity2 = new WotIdentity()
      await identity2.unlockFromStorage(passphrase)

      const did2 = identity2.getDid()
      expect(did2).toBe(result.did)
    })

    it('should throw error with wrong passphrase', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, true)

      const identity2 = new WotIdentity()
      await expect(identity2.unlockFromStorage('wrong-passphrase')).rejects.toThrow()
    })

    it('should throw error when no seed is stored', async () => {
      const passphrase = 'test-passphrase-123'

      await expect(identity.unlockFromStorage(passphrase)).rejects.toThrow(
        'No identity found in storage'
      )
    })
  })

  describe('sign()', () => {
    it('should sign data and return base64url signature', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, false)

      const data = 'Hello, World!'
      const signature = await identity.sign(data)

      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
      // Base64url format: no +, /, or = characters
      expect(signature).toMatch(/^[A-Za-z0-9_-]+$/)
    })
  })

  describe('getPublicKeyMultibase()', () => {
    it('should return public key in multibase format', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, false)

      const pubKey = await identity.getPublicKeyMultibase()

      expect(pubKey).toBeDefined()
      expect(pubKey).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/)
    })
  })

  describe('hasStoredIdentity()', () => {
    it('should return false when no identity is stored', async () => {
      const hasSeed = await identity.hasStoredIdentity()
      expect(hasSeed).toBe(false)
    })

    it('should return true after creating identity with storeSeed=true', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, true)

      const hasSeed = await identity.hasStoredIdentity()
      expect(hasSeed).toBe(true)
    })
  })

  describe('deleteStoredIdentity()', () => {
    it('should delete stored identity', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, true)

      expect(await identity.hasStoredIdentity()).toBe(true)

      await identity.deleteStoredIdentity()

      expect(await identity.hasStoredIdentity()).toBe(false)
    })

    it('should lock identity after deletion', async () => {
      const passphrase = 'test-passphrase-123'
      await identity.create(passphrase, true)

      await identity.deleteStoredIdentity()

      // Should throw because identity is locked
      expect(() => identity.getDid()).toThrow('Identity not unlocked')
    })
  })

  describe('signJws()', () => {
    it('should produce a valid JWS compact serialization', async () => {
      await identity.create('test-passphrase', false)
      const jws = await identity.signJws({ hello: 'world' })
      expect(typeof jws).toBe('string')
      const parts = jws.split('.')
      expect(parts).toHaveLength(3)
    })

    it('should be verifiable with the public key', async () => {
      await identity.create('test-passphrase', false)
      const payload = { did: identity.getDid(), name: 'Alice' }
      const jws = await identity.signJws(payload)
      const publicKey = await identity.getPublicKey()
      const result = await verifyJws(jws, publicKey)
      expect(result.valid).toBe(true)
      expect(result.payload).toEqual(payload)
    })

    it('should throw when identity is locked', async () => {
      await expect(identity.signJws({ test: true })).rejects.toThrow('Identity not unlocked')
    })
  })

  describe('Deterministic Key Derivation', () => {
    it('should generate same DID from same mnemonic across different instances', async () => {
      const passphrase = 'same-passphrase'

      // Create identity
      const identity1 = new WotIdentity()
      const result1 = await identity1.create(passphrase, false)

      // Restore from mnemonic in new instance
      const identity2 = new WotIdentity()
      await identity2.unlock(result1.mnemonic, passphrase)

      // Restore again in another new instance
      const identity3 = new WotIdentity()
      await identity3.unlock(result1.mnemonic, passphrase)

      const did1 = result1.did
      const did2 = identity2.getDid()
      const did3 = identity3.getDid()

      expect(did1).toBe(did2)
      expect(did2).toBe(did3)

      // Also verify public keys are the same
      const pubKey1 = await identity1.getPublicKeyMultibase()
      const pubKey2 = await identity2.getPublicKeyMultibase()
      const pubKey3 = await identity3.getPublicKeyMultibase()

      expect(pubKey1).toBe(pubKey2)
      expect(pubKey2).toBe(pubKey3)
    })
  })
})
