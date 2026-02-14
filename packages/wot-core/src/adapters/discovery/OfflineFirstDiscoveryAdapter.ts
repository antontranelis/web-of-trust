import type { PublicProfile } from '../../types/identity'
import type { Verification } from '../../types/verification'
import type { Attestation } from '../../types/attestation'
import type { WotIdentity } from '../../identity/WotIdentity'
import type {
  DiscoveryAdapter,
  PublicVerificationsData,
  PublicAttestationsData,
} from '../interfaces/DiscoveryAdapter'
import type { DiscoverySyncStore } from '../interfaces/DiscoverySyncStore'

/**
 * Offline-first wrapper for any DiscoveryAdapter.
 *
 * Decorator pattern: wraps an inner DiscoveryAdapter and adds:
 * - Dirty-flag tracking for publish operations (via DiscoverySyncStore)
 * - Profile caching for resolve operations
 * - syncPending() method for retry on reconnect
 *
 * The wrapper is optional — adapters that are natively offline-capable
 * (e.g. Automerge-based) don't need it.
 *
 * Usage:
 *   const http = new HttpDiscoveryAdapter(url)
 *   const syncStore = new EvoluDiscoverySyncStore(evolu, did)
 *   const discovery = new OfflineFirstDiscoveryAdapter(http, syncStore)
 */
export class OfflineFirstDiscoveryAdapter implements DiscoveryAdapter {
  constructor(
    private inner: DiscoveryAdapter,
    private syncStore: DiscoverySyncStore,
  ) {}

  async publishProfile(data: PublicProfile, identity: WotIdentity): Promise<void> {
    await this.syncStore.markDirty(data.did, 'profile')
    try {
      await this.inner.publishProfile(data, identity)
      await this.syncStore.clearDirty(data.did, 'profile')
    } catch {
      // Flag remains set — will be retried via syncPending()
    }
  }

  async publishVerifications(data: PublicVerificationsData, identity: WotIdentity): Promise<void> {
    await this.syncStore.markDirty(data.did, 'verifications')
    try {
      await this.inner.publishVerifications(data, identity)
      await this.syncStore.clearDirty(data.did, 'verifications')
    } catch {
      // Flag remains set — will be retried via syncPending()
    }
  }

  async publishAttestations(data: PublicAttestationsData, identity: WotIdentity): Promise<void> {
    await this.syncStore.markDirty(data.did, 'attestations')
    try {
      await this.inner.publishAttestations(data, identity)
      await this.syncStore.clearDirty(data.did, 'attestations')
    } catch {
      // Flag remains set — will be retried via syncPending()
    }
  }

  async resolveProfile(did: string): Promise<PublicProfile | null> {
    try {
      const result = await this.inner.resolveProfile(did)
      if (result) await this.syncStore.cacheProfile(did, result)
      return result
    } catch (error) {
      const cached = await this.syncStore.getCachedProfile(did)
      if (cached) return cached
      // No cache available — re-throw so the UI can detect the network error
      throw error
    }
  }

  async resolveVerifications(did: string): Promise<Verification[]> {
    try {
      return await this.inner.resolveVerifications(did)
    } catch {
      return []
    }
  }

  async resolveAttestations(did: string): Promise<Attestation[]> {
    try {
      return await this.inner.resolveAttestations(did)
    } catch {
      return []
    }
  }

  /**
   * Retry all pending publish operations.
   *
   * Called by the app when connectivity is restored (online event,
   * visibility change, or on mount).
   *
   * @param did - The local user's DID
   * @param identity - The unlocked WotIdentity (needed for JWS signing)
   * @param getPublishData - Callback that reads current local data at retry time
   *                         (not stale data from the original publish attempt)
   */
  async syncPending(
    did: string,
    identity: WotIdentity,
    getPublishData: () => Promise<{
      profile?: PublicProfile
      verifications?: PublicVerificationsData
      attestations?: PublicAttestationsData
    }>,
  ): Promise<void> {
    const dirty = await this.syncStore.getDirtyFields(did)
    if (dirty.size === 0) return

    const data = await getPublishData()

    if (dirty.has('profile') && data.profile) {
      try {
        await this.inner.publishProfile(data.profile, identity)
        await this.syncStore.clearDirty(did, 'profile')
      } catch {
        // Will be retried on next syncPending() call
      }
    }

    if (dirty.has('verifications') && data.verifications) {
      try {
        await this.inner.publishVerifications(data.verifications, identity)
        await this.syncStore.clearDirty(did, 'verifications')
      } catch {
        // Will be retried on next syncPending() call
      }
    }

    if (dirty.has('attestations') && data.attestations) {
      try {
        await this.inner.publishAttestations(data.attestations, identity)
        await this.syncStore.clearDirty(did, 'attestations')
      } catch {
        // Will be retried on next syncPending() call
      }
    }
  }
}
