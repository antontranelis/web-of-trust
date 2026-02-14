import type { PublicProfile } from '../../types/identity'
import type { DiscoverySyncField, DiscoverySyncStore } from '../interfaces/DiscoverySyncStore'

/**
 * In-memory implementation of DiscoverySyncStore.
 *
 * Useful for tests. Data is lost on page reload.
 */
export class InMemoryDiscoverySyncStore implements DiscoverySyncStore {
  private dirty = new Map<string, Set<DiscoverySyncField>>()
  private cache = new Map<string, PublicProfile>()

  async markDirty(did: string, field: DiscoverySyncField): Promise<void> {
    const fields = this.dirty.get(did) ?? new Set()
    fields.add(field)
    this.dirty.set(did, fields)
  }

  async clearDirty(did: string, field: DiscoverySyncField): Promise<void> {
    const fields = this.dirty.get(did)
    if (fields) {
      fields.delete(field)
      if (fields.size === 0) this.dirty.delete(did)
    }
  }

  async getDirtyFields(did: string): Promise<Set<DiscoverySyncField>> {
    return new Set(this.dirty.get(did) ?? [])
  }

  async cacheProfile(did: string, profile: PublicProfile): Promise<void> {
    this.cache.set(did, profile)
  }

  async getCachedProfile(did: string): Promise<PublicProfile | null> {
    return this.cache.get(did) ?? null
  }
}
