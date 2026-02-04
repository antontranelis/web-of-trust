import { useState, useEffect, useCallback } from 'react'
import { useAdapters } from '../context'
import type { Contact, ContactStatus } from '@real-life/wot-core'

export function useContacts() {
  const { contactService } = useAdapters()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const loaded = await contactService.getContacts()
      setContacts(loaded)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load contacts'))
    } finally {
      setIsLoading(false)
    }
  }, [contactService])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const addContact = useCallback(
    async (did: string, publicKey: string, name?: string, status: ContactStatus = 'pending') => {
      try {
        setError(null)
        const contact = await contactService.addContact(did, publicKey, name, status)
        await loadContacts()
        return contact
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to add contact')
        setError(err)
        throw err
      }
    },
    [contactService, loadContacts]
  )

  const activateContact = useCallback(
    async (did: string) => {
      try {
        setError(null)
        await contactService.activateContact(did)
        await loadContacts()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to activate contact')
        setError(err)
        throw err
      }
    },
    [contactService, loadContacts]
  )

  const updateContactName = useCallback(
    async (did: string, name: string) => {
      try {
        setError(null)
        await contactService.updateContactName(did, name)
        await loadContacts()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to update contact')
        setError(err)
        throw err
      }
    },
    [contactService, loadContacts]
  )

  const removeContact = useCallback(
    async (did: string) => {
      try {
        setError(null)
        await contactService.removeContact(did)
        await loadContacts()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to remove contact')
        setError(err)
        throw err
      }
    },
    [contactService, loadContacts]
  )

  // Filter by status
  const activeContacts = contacts.filter((c) => c.status === 'active')
  const pendingContacts = contacts.filter((c) => c.status === 'pending')

  return {
    contacts,
    activeContacts,
    pendingContacts,
    isLoading,
    error,
    addContact,
    activateContact,
    updateContactName,
    removeContact,
    refresh: loadContacts,
  }
}
