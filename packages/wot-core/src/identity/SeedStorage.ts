/**
 * SeedStorage - Encrypted storage for master seed
 *
 * Security:
 * - Master seed encrypted with PBKDF2(passphrase) + AES-GCM
 * - Stored in IndexedDB
 * - Never stored unencrypted
 */

interface EncryptedSeed {
  ciphertext: string // base64url
  salt: string // base64url for PBKDF2
  iv: string // base64url for AES-GCM
}

export class SeedStorage {
  private static readonly DB_NAME = 'wot-identity'
  private static readonly STORE_NAME = 'seeds'
  private static readonly PBKDF2_ITERATIONS = 100000
  private db: IDBDatabase | null = null

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SeedStorage.DB_NAME, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(SeedStorage.STORE_NAME)) {
          db.createObjectStore(SeedStorage.STORE_NAME)
        }
      }
    })
  }

  /**
   * Store encrypted seed
   *
   * @param seed - Master seed (32 bytes)
   * @param passphrase - User's passphrase
   */
  async storeSeed(seed: Uint8Array, passphrase: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    // Generate salt for PBKDF2
    const salt = crypto.getRandomValues(new Uint8Array(16))

    // Derive encryption key from passphrase
    const encryptionKey = await this.deriveEncryptionKey(passphrase, salt)

    // Generate IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt seed
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      seed
    )

    // Store encrypted data
    const encrypted: EncryptedSeed = {
      ciphertext: this.arrayBufferToBase64Url(ciphertext),
      salt: this.arrayBufferToBase64Url(salt.buffer),
      iv: this.arrayBufferToBase64Url(iv.buffer)
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SeedStorage.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(SeedStorage.STORE_NAME)
      const request = store.put(encrypted, 'master-seed')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Load and decrypt seed
   *
   * @param passphrase - User's passphrase
   * @returns Decrypted seed or null if not found
   */
  async loadSeed(passphrase: string): Promise<Uint8Array | null> {
    if (!this.db) {
      await this.init()
    }

    // Load encrypted data
    const encrypted = await this.getEncryptedSeed()
    if (!encrypted) {
      return null
    }

    try {
      // Derive encryption key from passphrase
      const salt = this.base64UrlToArrayBuffer(encrypted.salt)
      const encryptionKey = await this.deriveEncryptionKey(passphrase, new Uint8Array(salt))

      // Decrypt seed
      const iv = this.base64UrlToArrayBuffer(encrypted.iv)
      const ciphertext = this.base64UrlToArrayBuffer(encrypted.ciphertext)

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        encryptionKey,
        ciphertext
      )

      return new Uint8Array(decrypted)
    } catch (error) {
      // Decryption failed - wrong passphrase
      throw new Error('Invalid passphrase')
    }
  }

  /**
   * Check if seed exists in storage
   */
  async hasSeed(): Promise<boolean> {
    if (!this.db) {
      await this.init()
    }
    const encrypted = await this.getEncryptedSeed()
    return encrypted !== null
  }

  /**
   * Delete stored seed
   */
  async deleteSeed(): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SeedStorage.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(SeedStorage.STORE_NAME)
      const request = store.delete('master-seed')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Private methods

  private async getEncryptedSeed(): Promise<EncryptedSeed | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SeedStorage.STORE_NAME], 'readonly')
      const store = transaction.objectStore(SeedStorage.STORE_NAME)
      const request = store.get('master-seed')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  private async deriveEncryptionKey(
    passphrase: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    // Import passphrase as key material
    const passphraseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // Derive AES key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: SeedStorage.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passphraseKey,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    )
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
}
