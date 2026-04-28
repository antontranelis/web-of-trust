import { SeedStorage } from '../../identity/SeedStorage'
import type { IdentitySeedVault } from '../../ports'

export class SeedStorageIdentityVault implements IdentitySeedVault {
  constructor(private readonly storage = new SeedStorage()) {}

  saveSeed(seed: Uint8Array, passphrase: string): Promise<void> {
    return this.storage.storeSeed(seed, passphrase)
  }

  loadSeed(passphrase: string): Promise<Uint8Array | null> {
    return this.storage.loadSeed(passphrase)
  }

  loadSeedWithSessionKey(): Promise<Uint8Array | null> {
    return this.storage.loadSeedWithSessionKey()
  }

  deleteSeed(): Promise<void> {
    return this.storage.deleteSeed()
  }

  hasSeed(): Promise<boolean> {
    return this.storage.hasSeed()
  }

  hasActiveSession(): Promise<boolean> {
    return this.storage.hasActiveSession()
  }

  clearSessionKey(): Promise<void> {
    return this.storage.clearSessionKey()
  }
}
