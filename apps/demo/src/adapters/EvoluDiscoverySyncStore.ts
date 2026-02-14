/**
 * EvoluDiscoverySyncStore - Persistent DiscoverySyncStore backed by Evolu
 *
 * Stores dirty-flags and cached profiles in Evolu (SQLite via OPFS).
 * Data survives page reloads and app restarts.
 */
import {
  NonEmptyString,
  NonEmptyString1000,
  booleanToSqliteBoolean,
  sqliteBooleanToBoolean,
  createIdFromString,
  type Evolu,
} from '@evolu/common'
import type {
  DiscoverySyncStore,
  DiscoverySyncField,
  PublicProfile,
  Subscribable,
} from '@real-life/wot-core'
import type { AppSchema } from '../db'

type AppEvolu = Evolu<AppSchema>

const str = (s: string) => NonEmptyString1000.orThrow(s)
const longStr = (s: string) => NonEmptyString.orThrow(s)

/**
 * Dirty state snapshot for reactive UI.
 */
export interface DirtyState {
  profile: boolean
  verifications: boolean
  attestations: boolean
}

export class EvoluDiscoverySyncStore implements DiscoverySyncStore {
  constructor(private evolu: AppEvolu, private did: string) {}

  async markDirty(did: string, field: DiscoverySyncField): Promise<void> {
    const current = await this.loadSyncState(did)
    const update = { ...current }
    if (field === 'profile') update.profileDirty = true
    if (field === 'verifications') update.verificationsDirty = true
    if (field === 'attestations') update.attestationsDirty = true

    this.evolu.upsert('discoverySyncState', {
      id: createIdFromString<'DiscoverySyncState'>(`sync-${did}`),
      did: str(did),
      profileDirty: booleanToSqliteBoolean(update.profileDirty),
      verificationsDirty: booleanToSqliteBoolean(update.verificationsDirty),
      attestationsDirty: booleanToSqliteBoolean(update.attestationsDirty),
    })
  }

  async clearDirty(did: string, field: DiscoverySyncField): Promise<void> {
    const current = await this.loadSyncState(did)
    const update = { ...current }
    if (field === 'profile') update.profileDirty = false
    if (field === 'verifications') update.verificationsDirty = false
    if (field === 'attestations') update.attestationsDirty = false

    this.evolu.upsert('discoverySyncState', {
      id: createIdFromString<'DiscoverySyncState'>(`sync-${did}`),
      did: str(did),
      profileDirty: booleanToSqliteBoolean(update.profileDirty),
      verificationsDirty: booleanToSqliteBoolean(update.verificationsDirty),
      attestationsDirty: booleanToSqliteBoolean(update.attestationsDirty),
    })
  }

  async getDirtyFields(did: string): Promise<Set<DiscoverySyncField>> {
    const state = await this.loadSyncState(did)
    const fields = new Set<DiscoverySyncField>()
    if (state.profileDirty) fields.add('profile')
    if (state.verificationsDirty) fields.add('verifications')
    if (state.attestationsDirty) fields.add('attestations')
    return fields
  }

  async cacheProfile(did: string, profile: PublicProfile): Promise<void> {
    this.evolu.upsert('cachedProfile', {
      id: createIdFromString<'CachedProfile'>(`cache-${did}`),
      did: str(did),
      name: profile.name ? str(profile.name) : null,
      bio: profile.bio ? str(profile.bio) : null,
      avatar: profile.avatar ? longStr(profile.avatar) : null,
      fetchedAt: str(new Date().toISOString()),
    })
  }

  async getCachedProfile(did: string): Promise<PublicProfile | null> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('cachedProfile')
        .selectAll()
        .where('did', '=', str(did))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      did: row.did as string,
      name: (row.name as string) ?? '',
      ...(row.bio != null ? { bio: row.bio as string } : {}),
      ...(row.avatar != null ? { avatar: row.avatar as string } : {}),
      updatedAt: row.fetchedAt as string,
    }
  }

  /**
   * Reactive dirty state for UI components.
   *
   * Returns a Subscribable that emits the current dirty state
   * whenever it changes. Used for "Sync ausstehend" indicators.
   */
  watchDirtyState(): Subscribable<DirtyState> {
    const evolu = this.evolu
    const did = this.did
    const query = evolu.createQuery((db) =>
      db.selectFrom('discoverySyncState')
        .selectAll()
        .where('did', '=', str(did))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )

    const readState = (): DirtyState => {
      const rows = [...evolu.getQueryRows(query)]
      if (rows.length === 0) return { profile: false, verifications: false, attestations: false }
      const row = rows[0]
      return {
        profile: row.profileDirty != null ? sqliteBooleanToBoolean(row.profileDirty) : false,
        verifications: row.verificationsDirty != null ? sqliteBooleanToBoolean(row.verificationsDirty) : false,
        attestations: row.attestationsDirty != null ? sqliteBooleanToBoolean(row.attestationsDirty) : false,
      }
    }

    let snapshot = readState()

    return {
      subscribe: (callback) => {
        const unsub = evolu.subscribeQuery(query)(() => {
          const updated = readState()
          if (
            updated.profile !== snapshot.profile ||
            updated.verifications !== snapshot.verifications ||
            updated.attestations !== snapshot.attestations
          ) {
            snapshot = updated
            callback(snapshot)
          }
        })
        evolu.loadQuery(query).then(() => {
          const loaded = readState()
          if (
            loaded.profile !== snapshot.profile ||
            loaded.verifications !== snapshot.verifications ||
            loaded.attestations !== snapshot.attestations
          ) {
            snapshot = loaded
            callback(snapshot)
          }
        })
        return unsub
      },
      getValue: () => snapshot,
    }
  }

  // --- Private ---

  private async loadSyncState(did: string): Promise<{
    profileDirty: boolean
    verificationsDirty: boolean
    attestationsDirty: boolean
  }> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('discoverySyncState')
        .selectAll()
        .where('did', '=', str(did))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    if (rows.length === 0) {
      return { profileDirty: false, verificationsDirty: false, attestationsDirty: false }
    }
    const row = rows[0]
    return {
      profileDirty: row.profileDirty != null ? sqliteBooleanToBoolean(row.profileDirty) : false,
      verificationsDirty: row.verificationsDirty != null ? sqliteBooleanToBoolean(row.verificationsDirty) : false,
      attestationsDirty: row.attestationsDirty != null ? sqliteBooleanToBoolean(row.attestationsDirty) : false,
    }
  }
}
