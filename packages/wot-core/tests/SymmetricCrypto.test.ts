import { describe, it, expect } from 'vitest'
import { WebCryptoAdapter } from '../src/adapters/crypto/WebCryptoAdapter'

describe('Symmetric Encryption (AES-256-GCM)', () => {
  const crypto = new WebCryptoAdapter()

  describe('generateSymmetricKey()', () => {
    it('should return 32 bytes', async () => {
      const key = await crypto.generateSymmetricKey()
      expect(key).toBeInstanceOf(Uint8Array)
      expect(key.length).toBe(32)
    })

    it('should generate different keys each time', async () => {
      const key1 = await crypto.generateSymmetricKey()
      const key2 = await crypto.generateSymmetricKey()
      expect(key1).not.toEqual(key2)
    })
  })

  describe('encryptSymmetric() + decryptSymmetric()', () => {
    it('should round-trip encrypt and decrypt', async () => {
      const key = await crypto.generateSymmetricKey()
      const plaintext = new TextEncoder().encode('Hello, World!')
      const { ciphertext, nonce } = await crypto.encryptSymmetric(plaintext, key)
      const decrypted = await crypto.decryptSymmetric(ciphertext, nonce, key)
      expect(decrypted).toEqual(plaintext)
    })

    it('should produce different ciphertexts for same plaintext (random nonce)', async () => {
      const key = await crypto.generateSymmetricKey()
      const plaintext = new TextEncoder().encode('Same message')
      const result1 = await crypto.encryptSymmetric(plaintext, key)
      const result2 = await crypto.encryptSymmetric(plaintext, key)
      expect(result1.ciphertext).not.toEqual(result2.ciphertext)
      expect(result1.nonce).not.toEqual(result2.nonce)
    })

    it('should fail with wrong key', async () => {
      const key1 = await crypto.generateSymmetricKey()
      const key2 = await crypto.generateSymmetricKey()
      const plaintext = new TextEncoder().encode('Secret')
      const { ciphertext, nonce } = await crypto.encryptSymmetric(plaintext, key1)
      await expect(crypto.decryptSymmetric(ciphertext, nonce, key2)).rejects.toThrow()
    })

    it('should fail with wrong nonce', async () => {
      const key = await crypto.generateSymmetricKey()
      const plaintext = new TextEncoder().encode('Secret')
      const { ciphertext } = await crypto.encryptSymmetric(plaintext, key)
      const wrongNonce = globalThis.crypto.getRandomValues(new Uint8Array(12))
      await expect(crypto.decryptSymmetric(ciphertext, wrongNonce, key)).rejects.toThrow()
    })

    it('should fail with tampered ciphertext (GCM auth tag)', async () => {
      const key = await crypto.generateSymmetricKey()
      const plaintext = new TextEncoder().encode('Secret')
      const { ciphertext, nonce } = await crypto.encryptSymmetric(plaintext, key)
      const tampered = new Uint8Array(ciphertext)
      tampered[0] ^= 0xff
      await expect(crypto.decryptSymmetric(tampered, nonce, key)).rejects.toThrow()
    })

    it('should handle empty plaintext', async () => {
      const key = await crypto.generateSymmetricKey()
      const plaintext = new Uint8Array(0)
      const { ciphertext, nonce } = await crypto.encryptSymmetric(plaintext, key)
      const decrypted = await crypto.decryptSymmetric(ciphertext, nonce, key)
      expect(decrypted).toEqual(plaintext)
    })

    it('should handle large plaintext (64KB)', async () => {
      const key = await crypto.generateSymmetricKey()
      // happy-dom limits getRandomValues to 65536 bytes
      const plaintext = globalThis.crypto.getRandomValues(new Uint8Array(65536))
      const { ciphertext, nonce } = await crypto.encryptSymmetric(plaintext, key)
      const decrypted = await crypto.decryptSymmetric(ciphertext, nonce, key)
      expect(decrypted).toEqual(plaintext)
    })

    it('should return 12-byte nonce', async () => {
      const key = await crypto.generateSymmetricKey()
      const plaintext = new TextEncoder().encode('Test')
      const { nonce } = await crypto.encryptSymmetric(plaintext, key)
      expect(nonce.length).toBe(12)
    })
  })
})
