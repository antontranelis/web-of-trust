import { useMemo } from 'react'
import { useAdapters, useIdentity } from '../context'
import { useSubscribable } from './useSubscribable'
import type { Profile } from '@real-life/wot-core'
import type { EvoluStorageAdapter } from '../adapters/EvoluStorageAdapter'
import type { Subscribable } from '@real-life/wot-core'

const EMPTY_PROFILE: Profile = { name: '' }

/**
 * Reactive profile hook — updates automatically when Evolu syncs
 * profile data from another device.
 */
export function useProfile(): Profile {
  const { storage } = useAdapters()
  const { did } = useIdentity()

  const profileSubscribable: Subscribable<Profile> = useMemo(() => {
    if (!did) return { subscribe: () => () => {}, getValue: () => EMPTY_PROFILE }
    return (storage as EvoluStorageAdapter).watchProfile(did)
  }, [storage, did])

  return useSubscribable(profileSubscribable)
}
