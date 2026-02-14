import type { PublicProfile } from '../../types/identity'

/**
 * Sync field types for discovery publish operations.
 */
export type DiscoverySyncField = 'profile' | 'verifications' | 'attestations'

/**
 * Persistent store for discovery sync state.
 *
 * Tracks which publish operations are pending (dirty flags)
 * and caches resolved profiles for offline access.
 *
 * Implementations:
 * - InMemoryDiscoverySyncStore (for tests)
 * - EvoluDiscoverySyncStore (for Demo App, backed by Evolu/SQLite)
 * - Could be IndexedDB, filesystem, etc.
 */
export interface DiscoverySyncStore {
  /** Mark a field as needing sync to the discovery service */
  markDirty(did: string, field: DiscoverySyncField): Promise<void>

  /** Clear the dirty flag after successful sync */
  clearDirty(did: string, field: DiscoverySyncField): Promise<void>

  /** Get all fields that need syncing for a DID */
  getDirtyFields(did: string): Promise<Set<DiscoverySyncField>>

  /** Cache a resolved public profile for offline access */
  cacheProfile(did: string, profile: PublicProfile): Promise<void>

  /** Get a previously cached profile (returns null if not cached) */
  getCachedProfile(did: string): Promise<PublicProfile | null>
}
