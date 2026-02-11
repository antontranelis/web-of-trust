import { useEffect, useCallback, useRef } from 'react'
import { ProfileService, type PublicProfile, type MessageEnvelope } from '@real-life/wot-core'
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
        return
      }

      // Notify all contacts about the profile update via relay
      const contacts = await storage.getContacts()
      for (const contact of contacts) {
        const envelope: MessageEnvelope = {
          v: 1,
          id: crypto.randomUUID(),
          type: 'profile-update',
          fromDid: did,
          toDid: contact.did,
          createdAt: new Date().toISOString(),
          encoding: 'json',
          payload: JSON.stringify({ did, name: profile.name }),
          signature: '',
        }
        messaging.send(envelope).catch(() => {
          // Non-blocking — contact may be offline, relay will queue
        })
      }
    } catch (error) {
      console.warn('Profile upload failed:', error)
    }
  }, [identity, storage, messaging])

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
        if (profile && profile.name) {
          const needsUpdate =
            profile.name !== contact.name ||
            profile.avatar !== contact.avatar ||
            profile.bio !== contact.bio
          if (needsUpdate) {
            await storage.updateContact({
              ...contact,
              name: profile.name,
              ...(profile.avatar ? { avatar: profile.avatar } : {}),
              ...(profile.bio ? { bio: profile.bio } : {}),
            })
          }
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
          if (contact) {
            const needsUpdate =
              contact.name !== profile.name ||
              contact.avatar !== profile.avatar ||
              contact.bio !== profile.bio
            if (needsUpdate) {
              await storage.updateContact({
                ...contact,
                name: profile.name,
                ...(profile.avatar ? { avatar: profile.avatar } : {}),
                ...(profile.bio ? { bio: profile.bio } : {}),
              })
            }
          }
        }
      }
    })
    return unsubscribe
  }, [messaging, storage, fetchContactProfile])

  return { uploadProfile, fetchContactProfile }
}
