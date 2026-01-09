import { useState, useEffect, useCallback } from 'react'
import { useAdapters } from '../context'
import type { Contact, Profile, ContactStatus } from '../types'

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
    async (did: string, profile: Profile, status: ContactStatus = 'pending') => {
      try {
        setError(null)
        const contact = await contactService.addContact(did, profile, status)
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

  const verifyContact = useCallback(
    async (did: string) => {
      try {
        setError(null)
        await contactService.verifyContact(did)
        await loadContacts()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to verify contact')
        setError(err)
        throw err
      }
    },
    [contactService, loadContacts]
  )

  const hideContact = useCallback(
    async (did: string) => {
      try {
        setError(null)
        await contactService.hideContact(did)
        await loadContacts()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to hide contact')
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

  const verifiedContacts = contacts.filter((c) => c.status === 'verified')
  const pendingContacts = contacts.filter((c) => c.status === 'pending')
  const hiddenContacts = contacts.filter((c) => c.status === 'hidden')

  return {
    contacts,
    verifiedContacts,
    pendingContacts,
    hiddenContacts,
    isLoading,
    error,
    addContact,
    verifyContact,
    hideContact,
    removeContact,
    refresh: loadContacts,
  }
}
