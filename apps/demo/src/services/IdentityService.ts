import type { StorageAdapter, CryptoAdapter, Identity, Profile, KeyPair } from '@web-of-trust/core'

const KEYPAIR_STORAGE_KEY = 'wot-keypair'

export class IdentityService {
  private storage: StorageAdapter
  private crypto: CryptoAdapter

  constructor(storage: StorageAdapter, crypto: CryptoAdapter) {
    this.storage = storage
    this.crypto = crypto
  }

  async createIdentity(profile: Profile): Promise<Identity> {
    console.log('IdentityService.createIdentity called')

    // Generate key pair
    console.log('Generating key pair...')
    const keyPair = await this.crypto.generateKeyPair()
    console.log('Key pair generated:', keyPair)

    // Create DID from public key
    console.log('Creating DID...')
    const did = await this.crypto.createDid(keyPair.publicKey)
    console.log('DID created:', did)

    // Store key pair in localStorage (encrypted storage would be better in production)
    console.log('Exporting key pair...')
    const exported = await this.crypto.exportKeyPair(keyPair)
    localStorage.setItem(KEYPAIR_STORAGE_KEY, JSON.stringify(exported))
    console.log('Key pair stored')

    // Create and store identity
    console.log('Creating identity in storage...')
    const identity = await this.storage.createIdentity(did, profile)
    console.log('Identity created:', identity)
    return identity
  }

  async getIdentity(): Promise<Identity | null> {
    return this.storage.getIdentity()
  }

  async updateProfile(profile: Profile): Promise<void> {
    const identity = await this.storage.getIdentity()
    if (!identity) {
      throw new Error('No identity found')
    }
    identity.profile = profile
    await this.storage.updateIdentity(identity)
  }

  async getKeyPair(): Promise<KeyPair | null> {
    const stored = localStorage.getItem(KEYPAIR_STORAGE_KEY)
    if (!stored) return null

    try {
      const exported = JSON.parse(stored)
      return this.crypto.importKeyPair(exported)
    } catch {
      return null
    }
  }

  async hasIdentity(): Promise<boolean> {
    const identity = await this.storage.getIdentity()
    return identity !== null
  }

  async deleteIdentity(): Promise<void> {
    localStorage.removeItem(KEYPAIR_STORAGE_KEY)
    await this.storage.clear()
  }
}
