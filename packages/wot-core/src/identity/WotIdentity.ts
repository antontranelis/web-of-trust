import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { SeedStorage } from './SeedStorage'
import { WebCryptoAdapter } from '../adapters/crypto/WebCryptoAdapter'
import { germanPositiveWordlist } from '../wordlists/german-positive'
import { signJws as signJwsUtil } from '../crypto/jws'
import type { CryptoAdapter, EncryptedPayload, MasterKeyHandle, EncryptionKeyPair } from '../adapters/interfaces/CryptoAdapter'
import type { SeedStorageAdapter } from '../adapters/interfaces/SeedStorageAdapter'

/**
 * WotIdentity - BIP39-based identity with pluggable crypto and storage
 *
 * Security architecture:
 * - BIP39 Mnemonic (12 words, 128 bit entropy)
 * - Master Key derived via HKDF (non-extractable)
 * - Identity Private Key (non-extractable, Ed25519)
 * - Framework Keys (extractable for Evolu, etc.)
 *
 * Storage:
 * - Mnemonic: User must write down (never stored)
 * - Master Seed: Encrypted with PBKDF2(passphrase) + AES-GCM via SeedStorageAdapter
 * - Keys: All derived from master seed via HKDF
 */
export class WotIdentity {
  private masterKey: MasterKeyHandle | null = null
  private identityKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null
  private encKeyPair: EncryptionKeyPair | null = null
  private did: string | null = null
  private storage: SeedStorageAdapter
  private crypto: CryptoAdapter

  /**
   * @param storage - Seed storage adapter (default: IndexedDB-based SeedStorage)
   * @param cryptoAdapter - Crypto adapter (default: WebCryptoAdapter)
   */
  constructor(storage?: SeedStorageAdapter, cryptoAdapter?: CryptoAdapter) {
    this.storage = storage ?? new SeedStorage()
    this.crypto = cryptoAdapter ?? new WebCryptoAdapter()
  }

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
    const mnemonic = generateMnemonic(germanPositiveWordlist, 128)
    // Empty BIP39 passphrase: same mnemonic = same identity regardless of device password
    // The userPassphrase is only used for local seed encryption, not seed derivation
    const seed = mnemonicToSeedSync(mnemonic, '')

    // 2. Store encrypted seed (optional)
    if (storeSeed) {
      await this.storage.storeSeed(new Uint8Array(seed.slice(0, 32)), userPassphrase)
    }

    // 3. Import Master Key via adapter
    await this.initFromSeed(new Uint8Array(seed.slice(0, 32)))

    return { mnemonic, did: this.did! }
  }

  /**
   * Unlock identity from mnemonic + passphrase
   *
   * @param mnemonic - 12 word BIP39 mnemonic
   * @param passphrase - User's passphrase
   * @param storeSeed - Store encrypted seed in IndexedDB (default: false)
   */
  async unlock(mnemonic: string, passphrase: string, storeSeed: boolean = false): Promise<void> {
    // Validate mnemonic
    if (!validateMnemonic(mnemonic, germanPositiveWordlist)) {
      throw new Error('Invalid mnemonic')
    }

    // Derive seed - empty BIP39 passphrase so same mnemonic always yields same identity
    const seed = mnemonicToSeedSync(mnemonic, '')

    // Store encrypted seed (optional)
    if (storeSeed) {
      await this.storage.storeSeed(new Uint8Array(seed.slice(0, 32)), passphrase)
    }

    await this.initFromSeed(new Uint8Array(seed.slice(0, 32)))
  }


  /**
   * Unlock identity from stored encrypted seed.
   * If no passphrase is provided, attempts to use a cached session key.
   *
   * @param passphrase - User's passphrase (optional if session key is cached)
   * @throws Error if no seed stored, wrong passphrase, or no active session
   */
  async unlockFromStorage(passphrase?: string): Promise<void> {
    let seed: Uint8Array | null = null

    if (!passphrase) {
      // Try session key (no passphrase needed)
      seed = await this.storage.loadSeedWithSessionKey()
      if (!seed) {
        throw new Error('Session expired')
      }
    } else {
      // Normal flow: decrypt with passphrase (also caches session key)
      seed = await this.storage.loadSeed(passphrase)
      if (!seed) {
        throw new Error('No identity found in storage')
      }
    }

    await this.initFromSeed(seed)
  }

  /**
   * Check if a valid session key exists (allows unlock without passphrase)
   */
  async hasActiveSession(): Promise<boolean> {
    return this.storage.hasActiveSession()
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
    await this.lock()
  }

  /**
   * Lock identity (clear all keys from memory and session cache)
   */
  async lock(): Promise<void> {
    this.masterKey = null
    this.identityKeyPair = null
    this.encKeyPair = null
    this.did = null
    await this.storage.clearSessionKey()
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
   * Sign a payload as JWS (JSON Web Signature) compact serialization
   *
   * @param payload - Data to sign (will be JSON-serialized)
   * @returns JWS compact serialization (header.payload.signature)
   */
  async signJws(payload: unknown): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not unlocked')
    }
    return signJwsUtil(payload, this.identityKeyPair.privateKey)
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
    return this.crypto.signString(data, this.identityKeyPair.privateKey)
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
    return this.crypto.deriveBits(this.masterKey, info, 256)
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

  /**
   * Get public key as multibase encoded string (same format as in DID)
   */
  async getPublicKeyMultibase(): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not unlocked')
    }
    // DID format is did:key:z<multibase>, extract z... part
    const did = this.getDid()
    return did.replace('did:key:', '')
  }

  // --- Encryption (X25519 ECDH + AES-GCM) ---

  /**
   * Get the X25519 encryption key pair (derived via separate HKDF path).
   * Lazily derived on first call, then cached.
   */
  async getEncryptionKeyPair(): Promise<CryptoKeyPair> {
    if (!this.masterKey) {
      throw new Error('Identity not unlocked')
    }
    if (!this.encKeyPair) {
      const encSeed = await this.crypto.deriveBits(this.masterKey, 'wot-encryption-v1', 256)
      this.encKeyPair = await this.crypto.deriveEncryptionKeyPair(encSeed)
    }
    // For backward compatibility, return the internal CryptoKeyPair
    // This is a Web Crypto specific detail that will change when CryptoKey becomes opaque
    const handle = this.encKeyPair as unknown as { keyPair: CryptoKeyPair }
    return handle.keyPair
  }

  /**
   * Get X25519 public key as raw bytes (32 bytes).
   * This is what others need to encrypt messages for this identity.
   */
  async getEncryptionPublicKeyBytes(): Promise<Uint8Array> {
    if (!this.masterKey) {
      throw new Error('Identity not unlocked')
    }
    if (!this.encKeyPair) {
      const encSeed = await this.crypto.deriveBits(this.masterKey, 'wot-encryption-v1', 256)
      this.encKeyPair = await this.crypto.deriveEncryptionKeyPair(encSeed)
    }
    return this.crypto.exportEncryptionPublicKey(this.encKeyPair)
  }

  /**
   * Encrypt data for a recipient using their X25519 public key.
   * Uses ephemeral ECDH + HKDF + AES-256-GCM (ECIES-like).
   */
  async encryptForRecipient(
    plaintext: Uint8Array,
    recipientPublicKeyBytes: Uint8Array,
  ): Promise<EncryptedPayload> {
    if (!this.masterKey) {
      throw new Error('Identity not unlocked')
    }
    return this.crypto.encryptAsymmetric(plaintext, recipientPublicKeyBytes)
  }

  /**
   * Decrypt data encrypted for this identity.
   * Uses own X25519 private key + ephemeral public key from sender.
   */
  async decryptForMe(payload: EncryptedPayload): Promise<Uint8Array> {
    if (!this.masterKey) {
      throw new Error('Identity not unlocked')
    }
    if (!payload.ephemeralPublicKey) {
      throw new Error('Missing ephemeral public key')
    }
    if (!this.encKeyPair) {
      const encSeed = await this.crypto.deriveBits(this.masterKey, 'wot-encryption-v1', 256)
      this.encKeyPair = await this.crypto.deriveEncryptionKeyPair(encSeed)
    }
    return this.crypto.decryptAsymmetric(payload, this.encKeyPair)
  }

  // --- Private methods ---

  /**
   * Initialize identity from a 32-byte seed.
   * Shared logic for create(), unlock(), and unlockFromStorage().
   */
  private async initFromSeed(seed: Uint8Array): Promise<void> {
    // 1. Import master key via adapter
    this.masterKey = await this.crypto.importMasterKey(seed)

    // 2. Derive identity seed via HKDF, then derive Ed25519 key pair
    const identitySeed = await this.crypto.deriveBits(this.masterKey, 'wot-identity-v1', 256)
    this.identityKeyPair = await this.crypto.deriveKeyPairFromSeed(identitySeed)

    // 3. Generate DID from public key
    this.did = await this.crypto.createDid(this.identityKeyPair.publicKey)
  }
}
