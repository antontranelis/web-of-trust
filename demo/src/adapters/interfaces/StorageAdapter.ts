import type { Identity, Profile, Contact, Verification, Attestation } from '../../types'

export interface StorageAdapter {
  // Identity
  createIdentity(did: string, profile: Profile): Promise<Identity>
  getIdentity(): Promise<Identity | null>
  updateIdentity(identity: Identity): Promise<void>

  // Contacts
  addContact(contact: Contact): Promise<void>
  getContacts(): Promise<Contact[]>
  getContact(did: string): Promise<Contact | null>
  updateContact(contact: Contact): Promise<void>
  removeContact(did: string): Promise<void>

  // Verifications
  addVerification(verification: Verification): Promise<void>
  getVerifications(contactDid?: string): Promise<Verification[]>
  getVerification(id: string): Promise<Verification | null>

  // Attestations
  addAttestation(attestation: Attestation): Promise<void>
  getAttestations(issuerDid?: string): Promise<Attestation[]>
  getAttestationsAbout(subjectDid: string): Promise<Attestation[]>
  getAttestation(id: string): Promise<Attestation | null>

  // Lifecycle
  init(): Promise<void>
  clear(): Promise<void>
}
