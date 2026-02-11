import { useEffect, useCallback, useRef } from 'react'
import { ProfileService, type PublicProfile } from '@real-life/wot-core'
import { useAdapters } from '../context'
import { useIdentity } from '../context'

const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL ?? 'http://localhost:8788'

/**
 * Hook for syncing profiles with the profile service.
 *
 * - Uploads the local profile when it changes
 * - Fetches contact profiles and updates display names
 */
export function useProfileSync() {
  const { storage, messaging } = useAdapters()
  const { identity } = useIdentity()
  const fetchedRef = useRef(new Set<string>())

  /**
   * Upload the current user's profile to the profile service.
   * Called after profile changes in Identity page.
   */
  const uploadProfile = useCallback(async () => {
    if (!identity) return

    try {
      const localIdentity = await storage.getIdentity()
      if (!localIdentity) return

      const did = identity.getDid()
      const profile: PublicProfile = {
        did,
        name: localIdentity.profile.name,
        ...(localIdentity.profile.bio ? { bio: localIdentity.profile.bio } : {}),
        ...(localIdentity.profile.avatar ? { avatar: localIdentity.profile.avatar } : {}),
        updatedAt: new Date().toISOString(),
      }

      const jws = await ProfileService.signProfile(profile, identity)

      const res = await fetch(
        `${PROFILE_SERVICE_URL}/p/${encodeURIComponent(did)}`,
        {
          method: 'PUT',
          body: jws,
          headers: { 'Content-Type': 'text/plain' },
        },
      )

      if (!res.ok) {
        console.warn('Profile upload failed:', res.status, await res.text())
      }
    } catch (error) {
      console.warn('Profile upload failed:', error)
    }
  }, [identity, storage])

  /**
   * Fetch a contact's profile from the profile service.
   */
  const fetchContactProfile = useCallback(async (contactDid: string) => {
    try {
      const res = await fetch(
        `${PROFILE_SERVICE_URL}/p/${encodeURIComponent(contactDid)}`,
      )
      if (!res.ok) return null

      const jws = await res.text()
      const result = await ProfileService.verifyProfile(jws)
      if (!result.valid || !result.profile) return null

      return result.profile
    } catch {
      return null
    }
  }, [])

  /**
   * Sync all contact profiles on mount.
   */
  useEffect(() => {
    async function syncContacts() {
      const contacts = await storage.getContacts()
      for (const contact of contacts) {
        if (fetchedRef.current.has(contact.did)) continue
        fetchedRef.current.add(contact.did)

        const profile = await fetchContactProfile(contact.did)
        if (profile && profile.name && profile.name !== contact.name) {
          await storage.updateContact({
            ...contact,
            name: profile.name,
          })
        }
      }
    }
    syncContacts()
  }, [storage, fetchContactProfile])

  /**
   * Listen for profile-update messages and re-fetch.
   */
  useEffect(() => {
    const unsubscribe = messaging.onMessage(async (envelope) => {
      if (envelope.type === 'profile-update') {
        fetchedRef.current.delete(envelope.fromDid)
        const profile = await fetchContactProfile(envelope.fromDid)
        if (profile && profile.name) {
          const contacts = await storage.getContacts()
          const contact = contacts.find((c) => c.did === envelope.fromDid)
          if (contact && contact.name !== profile.name) {
            await storage.updateContact({
              ...contact,
              name: profile.name,
            })
          }
        }
      }
    })
    return unsubscribe
  }, [messaging, storage, fetchContactProfile])

  return { uploadProfile, fetchContactProfile }
}
