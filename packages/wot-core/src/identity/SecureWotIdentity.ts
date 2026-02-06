import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import * as ed25519 from '@noble/ed25519'
import { SeedStorage } from './SeedStorage'

/**
 * SecureWotIdentity - BIP39-based identity with native WebCrypto
 *
 * Security architecture:
 * - BIP39 Mnemonic (12 words, 128 bit entropy)
 * - Master Key derived via HKDF (non-extractable)
 * - Identity Private Key (non-extractable, Ed25519)
 * - Framework Keys (extractable for Evolu, etc.)
 *
 * Storage:
 * - Mnemonic: User must write down (never stored)
 * - Master Seed: Encrypted with PBKDF2(passphrase) + AES-GCM in IndexedDB
 * - Keys: All derived from master seed via HKDF
 */
export class SecureWotIdentity {
  private masterKey: CryptoKey | null = null
  private identityKeyPair: CryptoKeyPair | null = null
  private did: string | null = null
  private storage: SeedStorage = new SeedStorage()

  /**
   * Create a new identity with BIP39 mnemonic
   *
   * @param userPassphrase - User's passphrase for seed encryption
   * @param storeSeed - Store encrypted seed in IndexedDB (default: true)
   * @returns Mnemonic (12 words) and DID
   */
  async create(userPassphrase: string, storeSeed: boolean = true): Promise<{
    mnemonic: string
    did: string
  }> {
    // 1. Generate BIP39 Mnemonic (12 words = 128 bit entropy)
    const mnemonic = generateMnemonic(wordlist, 128)
    const seed = mnemonicToSeedSync(mnemonic, userPassphrase)

    // 2. Store encrypted seed (optional)
    if (storeSeed) {
      await this.storage.storeSeed(new Uint8Array(seed.slice(0, 32)), userPassphrase)
    }

    // 3. Import Master Key (non-extractable!)
    this.masterKey = await crypto.subtle.importKey(
      'raw',
      seed.slice(0, 32), // First 32 bytes
      { name: 'HKDF' },
      false, // non-extractable!
      ['deriveKey', 'deriveBits']
    )

    // 4. Derive Identity Key Pair (Ed25519, non-extractable)
    await this.deriveIdentityKeyPair()

    // 5. Generate DID from public key
    this.did = await this.generateDID()

    return { mnemonic, did: this.did }
  }

  /**
   * Unlock identity from mnemonic + passphrase
   *
   * @param mnemonic - 12 word BIP39 mnemonic
   * @param passphrase - User's passphrase
   */
  async unlock(mnemonic: string, passphrase: string): Promise<void> {
    // Validate mnemonic
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid mnemonic')
    }

    // Derive seed
    const seed = mnemonicToSeedSync(mnemonic, passphrase)

    // Import Master Key (non-extractable)
    this.masterKey = await crypto.subtle.importKey(
      'raw',
      seed.slice(0, 32),
      { name: 'HKDF' },
      false, // non-extractable!
      ['deriveKey', 'deriveBits']
    )

    // Derive Identity Key Pair
    await this.deriveIdentityKeyPair()

    // Generate DID
    this.did = await this.generateDID()
  }

  /**
   * Unlock identity from stored encrypted seed
   *
   * @param passphrase - User's passphrase
   * @throws Error if no seed stored or wrong passphrase
   */
  async unlockFromStorage(passphrase: string): Promise<void> {
    // Load and decrypt seed from storage
    const seed = await this.storage.loadSeed(passphrase)
    if (!seed) {
      throw new Error('No identity found in storage')
    }

    // Import Master Key (non-extractable)
    this.masterKey = await crypto.subtle.importKey(
      'raw',
      seed,
      { name: 'HKDF' },
      false, // non-extractable!
      ['deriveKey', 'deriveBits']
    )

    // Derive Identity Key Pair
    await this.deriveIdentityKeyPair()

    // Generate DID
    this.did = await this.generateDID()
  }

  /**
   * Check if identity exists in storage
   */
  async hasStoredIdentity(): Promise<boolean> {
    return this.storage.hasSeed()
  }

  /**
   * Delete stored identity
   */
  async deleteStoredIdentity(): Promise<void> {
    await this.storage.deleteSeed()
    this.lock()
  }

  /**
   * Lock identity (clear all keys from memory)
   */
  lock(): void {
    this.masterKey = null
    this.identityKeyPair = null
    this.did = null
  }

  /**
   * Get DID (Decentralized Identifier)
   */
  getDid(): string {
    if (!this.did) {
      throw new Error('Identity not unlocked')
    }
    return this.did
  }

  /**
   * Sign data with identity private key
   *
   * @param data - Data to sign
   * @returns Signature as base64url string
   */
  async sign(data: string): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not unlocked')
    }

    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign(
      'Ed25519',
      this.identityKeyPair.privateKey,
      encoder.encode(data)
    )

    return this.arrayBufferToBase64Url(signature)
  }

  /**
   * Derive framework-specific keys (extractable for Evolu, etc.)
   *
   * @param info - Context string (e.g., 'evolu-storage-v1')
   * @returns Derived key bytes
   */
  async deriveFrameworkKey(info: string): Promise<Uint8Array> {
    if (!this.masterKey) {
      throw new Error('Identity not unlocked')
    }

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(),
        info: new TextEncoder().encode(info)
      },
      this.masterKey,
      256 // 32 bytes
    )

    return new Uint8Array(bits)
  }

  /**
   * Get public key (for DID Document, etc.)
   */
  async getPublicKey(): Promise<CryptoKey> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not unlocked')
    }
    return this.identityKeyPair.publicKey
  }

  /**
   * Export public key as JWK
   */
  async exportPublicKeyJwk(): Promise<JsonWebKey> {
    const publicKey = await this.getPublicKey()
    return crypto.subtle.exportKey('jwk', publicKey)
  }

  // Private methods

  private async deriveIdentityKeyPair(): Promise<void> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized')
    }

    // Derive identity seed via HKDF (32 bytes)
    const identitySeed = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(),
        info: new TextEncoder().encode('wot-identity-v1')
      },
      this.masterKey,
      256 // 32 bytes for Ed25519
    )

    // Derive Ed25519 key pair from seed using @noble/ed25519
    // This ensures deterministic key generation: same seed → same keys
    const privateKeyBytes = new Uint8Array(identitySeed)
    const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes)

    // Import into WebCrypto (keep private key non-extractable where possible)
    // Note: We need to use JWK format for proper Ed25519 import
    const privateKeyJwk: JsonWebKey = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: this.arrayBufferToBase64Url(publicKeyBytes.buffer),
      d: this.arrayBufferToBase64Url(privateKeyBytes.buffer),
      ext: false, // non-extractable
      key_ops: ['sign']
    }

    const publicKeyJwk: JsonWebKey = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: this.arrayBufferToBase64Url(publicKeyBytes.buffer),
      ext: true,
      key_ops: ['verify']
    }

    // Import keys
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      'Ed25519',
      false, // non-extractable!
      ['sign']
    )

    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      'Ed25519',
      true, // public key can be extractable
      ['verify']
    )

    this.identityKeyPair = { privateKey, publicKey }
  }

  private async generateDID(): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Key pair not initialized')
    }

    // Export public key
    const publicKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      this.identityKeyPair.publicKey
    )

    // Create did:key identifier (multibase encoded)
    // Format: did:key:z...
    const publicKeyBytes = this.base64UrlToArrayBuffer(publicKeyJwk.x!)
    const multicodecPrefix = new Uint8Array([0xed, 0x01]) // Ed25519 public key
    const combined = new Uint8Array(multicodecPrefix.length + publicKeyBytes.byteLength)
    combined.set(multicodecPrefix)
    combined.set(new Uint8Array(publicKeyBytes), multicodecPrefix.length)

    const base58 = this.base58Encode(combined)
    return `did:key:z${base58}`
  }

  // Utility methods

  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private base64UrlToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  private base58Encode(bytes: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let result = ''

    // Convert to big integer
    let num = BigInt(0)
    for (const byte of bytes) {
      num = num * BigInt(256) + BigInt(byte)
    }

    // Convert to base58
    while (num > 0) {
      const remainder = num % BigInt(58)
      result = ALPHABET[Number(remainder)] + result
      num = num / BigInt(58)
    }

    // Handle leading zeros
    for (const byte of bytes) {
      if (byte === 0) {
        result = ALPHABET[0] + result
      } else {
        break
      }
    }

    return result
  }
}
