/**
 * EvoluStorageAdapter - StorageAdapter implementation backed by Evolu
 *
 * All profile data is stored in Evolu (SQLite via OPFS), encrypted with
 * keys derived from the user's BIP39 seed. No localStorage dependency.
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
  StorageAdapter,
  ReactiveStorageAdapter,
  Subscribable,
  Identity,
  Profile,
  Contact,
  Verification,
  Attestation,
  AttestationMetadata,
} from '@real-life/wot-core'
import type { AppSchema } from '../db'
import { rowToContact, rowToVerification, rowToAttestation } from './rowMappers'

type AppEvolu = Evolu<AppSchema>

const str = (s: string) => NonEmptyString1000.orThrow(s)
const longStr = (s: string) => NonEmptyString.orThrow(s)

export class EvoluStorageAdapter implements StorageAdapter, ReactiveStorageAdapter {
  private cachedIdentity: Identity | null = null

  constructor(private evolu: AppEvolu, private did: string) {}

  // --- Identity ---

  async createIdentity(did: string, profile: Profile): Promise<Identity> {
    const now = new Date().toISOString()
    const identity: Identity = { did, profile, createdAt: now, updatedAt: now }

    this.evolu.upsert('profile', {
      id: createIdFromString<'Profile'>(`profile-${did}`),
      did: str(did),
      name: profile.name ? str(profile.name) : null,
      bio: profile.bio ? str(profile.bio) : null,
      avatar: profile.avatar ? longStr(profile.avatar) : null,
    })

    this.cachedIdentity = identity
    return identity
  }

  async getIdentity(): Promise<Identity | null> {
    if (this.cachedIdentity) return this.cachedIdentity

    const profile = await this.getProfileFromEvolu(this.did)
    if (profile) {
      const now = new Date().toISOString()
      this.cachedIdentity = { did: this.did, profile, createdAt: now, updatedAt: now }
      return this.cachedIdentity
    }

    return null
  }

  async updateIdentity(identity: Identity): Promise<void> {
    identity.updatedAt = new Date().toISOString()

    this.evolu.upsert('profile', {
      id: createIdFromString<'Profile'>(`profile-${identity.did}`),
      did: str(identity.did),
      name: identity.profile.name ? str(identity.profile.name) : null,
      bio: identity.profile.bio ? str(identity.profile.bio) : null,
      avatar: identity.profile.avatar ? longStr(identity.profile.avatar) : null,
    })

    this.cachedIdentity = identity
  }

  private async getProfileFromEvolu(did: string): Promise<Profile | null> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('profile')
        .selectAll()
        .where('did', '=', str(did))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      name: (row.name as string) ?? '',
      ...(row.bio != null ? { bio: row.bio as string } : {}),
      ...(row.avatar != null ? { avatar: row.avatar as string } : {}),
    }
  }

  // --- Contacts ---

  async addContact(contact: Contact): Promise<void> {
    const result = this.evolu.upsert('contact', {
      id: createIdFromString<'Contact'>(contact.did),
      did: str(contact.did),
      publicKey: str(contact.publicKey),
      name: contact.name ? str(contact.name) : null,
      avatar: contact.avatar ? longStr(contact.avatar) : null,
      bio: contact.bio ? str(contact.bio) : null,
      status: str(contact.status),
      verifiedAt: contact.verifiedAt ? str(contact.verifiedAt) : null,
    })
    if (!result.ok) {
      throw new Error(`Failed to add contact: ${JSON.stringify(result.error)}`)
    }
  }

  async getContacts(): Promise<Contact[]> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('contact')
        .selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return [...rows].map(rowToContact)
  }

  async getContact(did: string): Promise<Contact | null> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('contact')
        .selectAll()
        .where('did', '=', str(did))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return rows.length > 0 ? rowToContact(rows[0]) : null
  }

  async updateContact(contact: Contact): Promise<void> {
    this.evolu.update('contact', {
      id: createIdFromString<'Contact'>(contact.did),
      did: str(contact.did),
      publicKey: str(contact.publicKey),
      name: contact.name ? str(contact.name) : null,
      avatar: contact.avatar ? longStr(contact.avatar) : null,
      bio: contact.bio ? str(contact.bio) : null,
      status: str(contact.status),
      verifiedAt: contact.verifiedAt ? str(contact.verifiedAt) : null,
    })
  }

  async removeContact(did: string): Promise<void> {
    this.evolu.update('contact', {
      id: createIdFromString<'Contact'>(did),
      isDeleted: booleanToSqliteBoolean(true),
    })
  }

  // --- Verifications ---

  async saveVerification(verification: Verification): Promise<void> {
    const result = this.evolu.upsert('verification', {
      id: createIdFromString<'Verification'>(verification.id),
      fromDid: str(verification.from),
      toDid: str(verification.to),
      timestamp: str(verification.timestamp),
      proofJson: str(JSON.stringify(verification.proof)),
      locationJson: verification.location
        ? str(JSON.stringify(verification.location))
        : null,
    })
    if (!result.ok) {
      throw new Error(`Failed to save verification: ${JSON.stringify(result.error)}`)
    }
  }

  async getReceivedVerifications(): Promise<Verification[]> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('verification')
        .selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return [...rows].map(rowToVerification)
  }

  async getVerification(id: string): Promise<Verification | null> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('verification')
        .selectAll()
        .where('id', '=', createIdFromString<'Verification'>(id))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return rows.length > 0 ? rowToVerification(rows[0]) : null
  }

  // --- Attestations ---

  async saveAttestation(attestation: Attestation): Promise<void> {
    const result = this.evolu.upsert('attestation', {
      id: createIdFromString<'Attestation'>(attestation.id),
      fromDid: str(attestation.from),
      toDid: str(attestation.to),
      claim: str(attestation.claim),
      tagsJson: attestation.tags
        ? str(JSON.stringify(attestation.tags))
        : null,
      context: attestation.context ? str(attestation.context) : null,
      proofJson: str(JSON.stringify(attestation.proof)),
    })
    if (!result.ok) {
      throw new Error(`Failed to save attestation: ${JSON.stringify(result.error)}`)
    }

    this.evolu.upsert('attestationMetadata', {
      id: createIdFromString<'AttestationMetadata'>(`meta-${attestation.id}`),
      attestationId: str(attestation.id),
      accepted: booleanToSqliteBoolean(false),
      acceptedAt: null,
    })
  }

  async getReceivedAttestations(): Promise<Attestation[]> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('attestation')
        .selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return [...rows].map(rowToAttestation)
  }

  async getAttestation(id: string): Promise<Attestation | null> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('attestation')
        .selectAll()
        .where('id', '=', createIdFromString<'Attestation'>(id))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return rows.length > 0 ? rowToAttestation(rows[0]) : null
  }

  // --- Attestation Metadata ---

  async getAttestationMetadata(attestationId: string): Promise<AttestationMetadata | null> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('attestationMetadata')
        .selectAll()
        .where('attestationId', '=', str(attestationId))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      attestationId: row.attestationId as string,
      accepted: row.accepted != null ? sqliteBooleanToBoolean(row.accepted) : false,
      ...(row.acceptedAt != null ? { acceptedAt: row.acceptedAt as string } : {}),
    }
  }

  async setAttestationAccepted(attestationId: string, accepted: boolean): Promise<void> {
    this.evolu.upsert('attestationMetadata', {
      id: createIdFromString<'AttestationMetadata'>(`meta-${attestationId}`),
      attestationId: str(attestationId),
      accepted: booleanToSqliteBoolean(accepted),
      acceptedAt: accepted ? str(new Date().toISOString()) : null,
    })
  }

  // --- Lifecycle ---

  async init(): Promise<void> {}

  async clear(): Promise<void> {
    this.cachedIdentity = null
  }

  // --- Reactive (ReactiveStorageAdapter) ---

  watchProfile(did: string): Subscribable<Profile> {
    const evolu = this.evolu
    const query = evolu.createQuery((db) =>
      db.selectFrom('profile').selectAll()
        .where('did', '=', str(did))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )

    const rowToProfile = (): Profile => {
      const rows = [...evolu.getQueryRows(query)]
      if (rows.length === 0) return { name: '' }
      const row = rows[0]
      return {
        name: (row.name as string) ?? '',
        ...(row.bio != null ? { bio: row.bio as string } : {}),
        ...(row.avatar != null ? { avatar: row.avatar as string } : {}),
      }
    }

    const profileChanged = (a: Profile, b: Profile) =>
      a.name !== b.name || a.bio !== b.bio || a.avatar !== b.avatar

    let snapshot: Profile = rowToProfile()

    return {
      subscribe: (callback) => {
        const unsub = evolu.subscribeQuery(query)(() => {
          const updated = rowToProfile()
          if (profileChanged(updated, snapshot)) {
            snapshot = updated
            if (this.cachedIdentity) {
              this.cachedIdentity = { ...this.cachedIdentity, profile: updated, updatedAt: new Date().toISOString() }
            }
            callback(snapshot)
          }
        })
        evolu.loadQuery(query).then(() => {
          const loaded = rowToProfile()
          if (profileChanged(loaded, snapshot)) {
            snapshot = loaded
            callback(snapshot)
          }
        })
        return unsub
      },
      getValue: () => snapshot,
    }
  }

  watchContacts(): Subscribable<Contact[]> {
    const evolu = this.evolu
    const query = evolu.createQuery((db) =>
      db.selectFrom('contact').selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    let snapshot: Contact[] = [...evolu.getQueryRows(query)].map(rowToContact)
    return {
      subscribe: (callback) => {
        const unsub = evolu.subscribeQuery(query)(() => {
          snapshot = [...evolu.getQueryRows(query)].map(rowToContact)
          callback(snapshot)
        })
        evolu.loadQuery(query).then(() => {
          snapshot = [...evolu.getQueryRows(query)].map(rowToContact)
          callback(snapshot)
        })
        return unsub
      },
      getValue: () => snapshot,
    }
  }

  watchReceivedVerifications(): Subscribable<Verification[]> {
    const evolu = this.evolu
    const query = evolu.createQuery((db) =>
      db.selectFrom('verification').selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    let snapshot: Verification[] = [...evolu.getQueryRows(query)].map(rowToVerification)
    return {
      subscribe: (callback) => {
        const unsub = evolu.subscribeQuery(query)(() => {
          snapshot = [...evolu.getQueryRows(query)].map(rowToVerification)
          callback(snapshot)
        })
        evolu.loadQuery(query).then(() => {
          snapshot = [...evolu.getQueryRows(query)].map(rowToVerification)
          callback(snapshot)
        })
        return unsub
      },
      getValue: () => snapshot,
    }
  }

  watchReceivedAttestations(): Subscribable<Attestation[]> {
    const evolu = this.evolu
    const query = evolu.createQuery((db) =>
      db.selectFrom('attestation').selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    let snapshot: Attestation[] = [...evolu.getQueryRows(query)].map(rowToAttestation)
    return {
      subscribe: (callback) => {
        const unsub = evolu.subscribeQuery(query)(() => {
          snapshot = [...evolu.getQueryRows(query)].map(rowToAttestation)
          callback(snapshot)
        })
        evolu.loadQuery(query).then(() => {
          snapshot = [...evolu.getQueryRows(query)].map(rowToAttestation)
          callback(snapshot)
        })
        return unsub
      },
      getValue: () => snapshot,
    }
  }
}
