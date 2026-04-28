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

  deleteSeed(): Promise<void> {
    return this.storage.deleteSeed()
  }

  hasSeed(): Promise<boolean> {
    return this.storage.hasSeed()
  }
}
