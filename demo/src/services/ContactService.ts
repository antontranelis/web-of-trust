import type { StorageAdapter } from '../adapters'
import type { Contact, Profile, ContactStatus } from '../types'

export class ContactService {
  constructor(private storage: StorageAdapter) {}

  async addContact(did: string, profile: Profile, status: ContactStatus = 'pending'): Promise<Contact> {
    const now = new Date().toISOString()
    const contact: Contact = {
      did,
      profile,
      status,
      createdAt: now,
      updatedAt: now,
    }
    await this.storage.addContact(contact)
    return contact
  }

  async getContacts(): Promise<Contact[]> {
    return this.storage.getContacts()
  }

  async getVerifiedContacts(): Promise<Contact[]> {
    const contacts = await this.storage.getContacts()
    return contacts.filter((c) => c.status === 'verified')
  }

  async getContact(did: string): Promise<Contact | null> {
    return this.storage.getContact(did)
  }

  async verifyContact(did: string): Promise<void> {
    const contact = await this.storage.getContact(did)
    if (!contact) {
      throw new Error('Contact not found')
    }
    contact.status = 'verified'
    contact.verifiedAt = new Date().toISOString()
    await this.storage.updateContact(contact)
  }

  async hideContact(did: string): Promise<void> {
    const contact = await this.storage.getContact(did)
    if (!contact) {
      throw new Error('Contact not found')
    }
    contact.status = 'hidden'
    contact.hiddenAt = new Date().toISOString()
    await this.storage.updateContact(contact)
  }

  async updateContactProfile(did: string, profile: Profile): Promise<void> {
    const contact = await this.storage.getContact(did)
    if (!contact) {
      throw new Error('Contact not found')
    }
    contact.profile = profile
    await this.storage.updateContact(contact)
  }

  async removeContact(did: string): Promise<void> {
    await this.storage.removeContact(did)
  }
}
