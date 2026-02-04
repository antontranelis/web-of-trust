import type { StorageAdapter, Contact, ContactStatus } from '@real-life/wot-core'

export class ContactService {
  constructor(private storage: StorageAdapter) {}

  async addContact(
    did: string,
    publicKey: string,
    name?: string,
    status: ContactStatus = 'pending'
  ): Promise<Contact> {
    const now = new Date().toISOString()
    const contact: Contact = {
      did,
      publicKey,
      name,
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

  async getActiveContacts(): Promise<Contact[]> {
    const contacts = await this.storage.getContacts()
    return contacts.filter((c) => c.status === 'active')
  }

  async getContact(did: string): Promise<Contact | null> {
    return this.storage.getContact(did)
  }

  async activateContact(did: string): Promise<void> {
    const contact = await this.storage.getContact(did)
    if (!contact) {
      throw new Error('Contact not found')
    }
    contact.status = 'active'
    contact.verifiedAt = new Date().toISOString()
    await this.storage.updateContact(contact)
  }

  async updateContactName(did: string, name: string): Promise<void> {
    const contact = await this.storage.getContact(did)
    if (!contact) {
      throw new Error('Contact not found')
    }
    contact.name = name
    await this.storage.updateContact(contact)
  }

  async removeContact(did: string): Promise<void> {
    await this.storage.removeContact(did)
  }
}
