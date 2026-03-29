import { describe, it, expect, beforeEach } from 'vitest'
import { WebCryptoAdapter } from '../src/adapters/crypto/WebCryptoAdapter'

describe('CryptoAdapter Extended (HKDF, X25519, Asymmetric Encryption)', () => {
  let adapter: WebCryptoAdapter

  beforeEach(() => {
    adapter = new WebCryptoAdapter()
  })

  // --- HKDF Key Derivation ---

  describe('importMasterKey + deriveBits', () => {
    it('should import a 32-byte seed as master key', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      expect(masterKey).toBeDefined()
    })

    it('should derive deterministic bits from master key', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)

      const bits1 = await adapter.deriveBits(masterKey, 'test-context-v1', 256)
      const bits2 = await adapter.deriveBits(masterKey, 'test-context-v1', 256)
      expect(bits1).toEqual(bits2)
    })

    it('should derive different bits for different info strings', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)

      const bits1 = await adapter.deriveBits(masterKey, 'context-a', 256)
      const bits2 = await adapter.deriveBits(masterKey, 'context-b', 256)
      expect(bits1).not.toEqual(bits2)
    })

    it('should derive 32 bytes (256 bits)', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const bits = await adapter.deriveBits(masterKey, 'test', 256)
      expect(bits).toBeInstanceOf(Uint8Array)
      expect(bits.length).toBe(32)
    })
  })

  // --- Deterministic Ed25519 Key Pair from Seed ---

  describe('deriveKeyPairFromSeed', () => {
    it('should derive a key pair from a 32-byte seed', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const keyPair = await adapter.deriveKeyPairFromSeed(seed)
      expect(keyPair.publicKey).toBeDefined()
      expect(keyPair.privateKey).toBeDefined()
    })

    it('should be deterministic (same seed = same keys)', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const kp1 = await adapter.deriveKeyPairFromSeed(seed)
      const kp2 = await adapter.deriveKeyPairFromSeed(seed)

      const pub1 = await adapter.exportPublicKey(kp1.publicKey)
      const pub2 = await adapter.exportPublicKey(kp2.publicKey)
      expect(pub1).toBe(pub2)
    })

    it('should produce different keys from different seeds', async () => {
      const seed1 = crypto.getRandomValues(new Uint8Array(32))
      const seed2 = crypto.getRandomValues(new Uint8Array(32))
      const kp1 = await adapter.deriveKeyPairFromSeed(seed1)
      const kp2 = await adapter.deriveKeyPairFromSeed(seed2)

      const pub1 = await adapter.exportPublicKey(kp1.publicKey)
      const pub2 = await adapter.exportPublicKey(kp2.publicKey)
      expect(pub1).not.toBe(pub2)
    })

    it('should produce valid signing keys', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const keyPair = await adapter.deriveKeyPairFromSeed(seed)

      const data = new TextEncoder().encode('test message')
      const signature = await adapter.sign(data, keyPair.privateKey)
      const valid = await adapter.verify(data, signature, keyPair.publicKey)
      expect(valid).toBe(true)
    })
  })

  // --- Asymmetric Encryption (ECIES: ephemeral X25519 + HKDF + AES-GCM) ---

  describe('encryptAsymmetric + decryptAsymmetric', () => {
    it('should encrypt and decrypt a message', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const encSeed = await adapter.deriveBits(masterKey, 'wot-encryption-v1', 256)
      const encKeyPair = await adapter.deriveEncryptionKeyPair(encSeed)

      const recipientPubBytes = await adapter.exportEncryptionPublicKey(encKeyPair)
      const plaintext = new TextEncoder().encode('Hello from Alice!')

      const encrypted = await adapter.encryptAsymmetric(plaintext, recipientPubBytes)
      expect(encrypted.ciphertext).toBeDefined()
      expect(encrypted.nonce).toBeDefined()
      expect(encrypted.ephemeralPublicKey).toBeDefined()

      const decrypted = await adapter.decryptAsymmetric(encrypted, encKeyPair)
      expect(decrypted).toEqual(plaintext)
    })

    it('should produce different ciphertexts for same plaintext (ephemeral key)', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const encSeed = await adapter.deriveBits(masterKey, 'wot-encryption-v1', 256)
      const encKeyPair = await adapter.deriveEncryptionKeyPair(encSeed)

      const recipientPubBytes = await adapter.exportEncryptionPublicKey(encKeyPair)
      const plaintext = new TextEncoder().encode('same message')

      const enc1 = await adapter.encryptAsymmetric(plaintext, recipientPubBytes)
      const enc2 = await adapter.encryptAsymmetric(plaintext, recipientPubBytes)

      expect(enc1.ciphertext).not.toEqual(enc2.ciphertext)
    })

    it('should fail to decrypt with wrong key', async () => {
      const seed1 = crypto.getRandomValues(new Uint8Array(32))
      const seed2 = crypto.getRandomValues(new Uint8Array(32))

      const masterKey1 = await adapter.importMasterKey(seed1)
      const encSeed1 = await adapter.deriveBits(masterKey1, 'wot-encryption-v1', 256)
      const encKeyPair1 = await adapter.deriveEncryptionKeyPair(encSeed1)

      const masterKey2 = await adapter.importMasterKey(seed2)
      const encSeed2 = await adapter.deriveBits(masterKey2, 'wot-encryption-v1', 256)
      const encKeyPair2 = await adapter.deriveEncryptionKeyPair(encSeed2)

      const recipientPubBytes = await adapter.exportEncryptionPublicKey(encKeyPair1)
      const plaintext = new TextEncoder().encode('secret')

      const encrypted = await adapter.encryptAsymmetric(plaintext, recipientPubBytes)

      await expect(
        adapter.decryptAsymmetric(encrypted, encKeyPair2)
      ).rejects.toThrow()
    })

    it('should handle large plaintext (1KB)', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const encSeed = await adapter.deriveBits(masterKey, 'wot-encryption-v1', 256)
      const encKeyPair = await adapter.deriveEncryptionKeyPair(encSeed)

      const recipientPubBytes = await adapter.exportEncryptionPublicKey(encKeyPair)
      const plaintext = crypto.getRandomValues(new Uint8Array(1024))

      const encrypted = await adapter.encryptAsymmetric(plaintext, recipientPubBytes)
      const decrypted = await adapter.decryptAsymmetric(encrypted, encKeyPair)
      expect(decrypted).toEqual(plaintext)
    })
  })

  // --- X25519 Encryption Key Pair ---

  describe('deriveEncryptionKeyPair', () => {
    it('should derive an X25519 key pair from seed', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const encSeed = await adapter.deriveBits(masterKey, 'wot-encryption-v1', 256)
      const encKeyPair = await adapter.deriveEncryptionKeyPair(encSeed)
      expect(encKeyPair).toBeDefined()
    })

    it('should be deterministic', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const encSeed = await adapter.deriveBits(masterKey, 'wot-encryption-v1', 256)

      const kp1 = await adapter.deriveEncryptionKeyPair(encSeed)
      const kp2 = await adapter.deriveEncryptionKeyPair(encSeed)

      const pub1 = await adapter.exportEncryptionPublicKey(kp1)
      const pub2 = await adapter.exportEncryptionPublicKey(kp2)
      expect(pub1).toEqual(pub2)
    })

    it('should export public key as 32 bytes', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32))
      const masterKey = await adapter.importMasterKey(seed)
      const encSeed = await adapter.deriveBits(masterKey, 'wot-encryption-v1', 256)
      const encKeyPair = await adapter.deriveEncryptionKeyPair(encSeed)

      const pubBytes = await adapter.exportEncryptionPublicKey(encKeyPair)
      expect(pubBytes).toBeInstanceOf(Uint8Array)
      expect(pubBytes.length).toBe(32)
    })
  })

  // --- Random Bytes ---

  describe('randomBytes', () => {
    it('should generate bytes of requested length', () => {
      const bytes = adapter.randomBytes(32)
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBe(32)
    })

    it('should generate different values each time', () => {
      const a = adapter.randomBytes(16)
      const b = adapter.randomBytes(16)
      expect(a).not.toEqual(b)
    })
  })
})
