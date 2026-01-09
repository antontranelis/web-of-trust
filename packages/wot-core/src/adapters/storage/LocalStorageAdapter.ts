import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter } from '../interfaces/StorageAdapter'
import type { Identity, Profile, Contact, Verification, Attestation } from '../../types'

const DB_NAME = 'web-of-trust'
const DB_VERSION = 1

interface WoTDB {
  identity: {
    key: string
    value: Identity
  }
  contacts: {
    key: string
    value: Contact
    indexes: { 'by-status': string }
  }
  verifications: {
    key: string
    value: Verification
    indexes: { 'by-contact': string }
  }
  attestations: {
    key: string
    value: Attestation
    indexes: { 'by-issuer': string; 'by-subject': string }
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  private db: IDBPDatabase<WoTDB> | null = null

  async init(): Promise<void> {
    this.db = await openDB<WoTDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Identity store (single record)
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'did' })
        }

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'did' })
          contactStore.createIndex('by-status', 'status')
        }

        // Verifications store
        if (!db.objectStoreNames.contains('verifications')) {
          const verificationStore = db.createObjectStore('verifications', { keyPath: 'id' })
          verificationStore.createIndex('by-contact', 'responderDid')
        }

        // Attestations store
        if (!db.objectStoreNames.contains('attestations')) {
          const attestationStore = db.createObjectStore('attestations', { keyPath: 'id' })
          attestationStore.createIndex('by-issuer', 'issuerDid')
          attestationStore.createIndex('by-subject', 'subjectDid')
        }
      },
    })
  }

  private ensureDb(): IDBPDatabase<WoTDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.db
  }

  // Identity methods
  async createIdentity(did: string, profile: Profile): Promise<Identity> {
    const db = this.ensureDb()
    const now = new Date().toISOString()
    const identity: Identity = {
      did,
      profile,
      createdAt: now,
      updatedAt: now,
    }
    await db.put('identity', identity)
    return identity
  }

  async getIdentity(): Promise<Identity | null> {
    const db = this.ensureDb()
    const all = await db.getAll('identity')
    return all[0] || null
  }

  async updateIdentity(identity: Identity): Promise<void> {
    const db = this.ensureDb()
    identity.updatedAt = new Date().toISOString()
    await db.put('identity', identity)
  }

  // Contact methods
  async addContact(contact: Contact): Promise<void> {
    const db = this.ensureDb()
    await db.put('contacts', contact)
  }

  async getContacts(): Promise<Contact[]> {
    const db = this.ensureDb()
    return db.getAll('contacts')
  }

  async getContact(did: string): Promise<Contact | null> {
    const db = this.ensureDb()
    return (await db.get('contacts', did)) || null
  }

  async updateContact(contact: Contact): Promise<void> {
    const db = this.ensureDb()
    contact.updatedAt = new Date().toISOString()
    await db.put('contacts', contact)
  }

  async removeContact(did: string): Promise<void> {
    const db = this.ensureDb()
    await db.delete('contacts', did)
  }

  // Verification methods
  async addVerification(verification: Verification): Promise<void> {
    const db = this.ensureDb()
    await db.put('verifications', verification)
  }

  async getVerifications(contactDid?: string): Promise<Verification[]> {
    const db = this.ensureDb()
    if (contactDid) {
      return db.getAllFromIndex('verifications', 'by-contact', contactDid)
    }
    return db.getAll('verifications')
  }

  async getVerification(id: string): Promise<Verification | null> {
    const db = this.ensureDb()
    return (await db.get('verifications', id)) || null
  }

  // Attestation methods
  async addAttestation(attestation: Attestation): Promise<void> {
    const db = this.ensureDb()
    await db.put('attestations', attestation)
  }

  async getAttestations(issuerDid?: string): Promise<Attestation[]> {
    const db = this.ensureDb()
    if (issuerDid) {
      return db.getAllFromIndex('attestations', 'by-issuer', issuerDid)
    }
    return db.getAll('attestations')
  }

  async getAttestationsAbout(subjectDid: string): Promise<Attestation[]> {
    const db = this.ensureDb()
    return db.getAllFromIndex('attestations', 'by-subject', subjectDid)
  }

  async getAttestation(id: string): Promise<Attestation | null> {
    const db = this.ensureDb()
    return (await db.get('attestations', id)) || null
  }

  // Lifecycle
  async clear(): Promise<void> {
    const db = this.ensureDb()
    await Promise.all([
      db.clear('identity'),
      db.clear('contacts'),
      db.clear('verifications'),
      db.clear('attestations'),
    ])
  }
}
