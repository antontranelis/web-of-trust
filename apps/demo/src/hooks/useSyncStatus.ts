import { useState, useEffect } from 'react'
import { useAdapters } from '../context'
import type { DirtyState } from '../adapters/EvoluDiscoverySyncStore'

/**
 * Hook that tracks pending discovery sync state.
 * Returns whether any publish operations are pending.
 */
export function useSyncStatus() {
  const { discoverySyncStore } = useAdapters()
  const [dirtyState, setDirtyState] = useState<DirtyState>({ profile: false, verifications: false, attestations: false })

  useEffect(() => {
    const subscribable = discoverySyncStore.watchDirtyState()
    setDirtyState(subscribable.getValue())

    const unsub = subscribable.subscribe((state) => {
      setDirtyState(state)
    })

    return unsub
  }, [discoverySyncStore])

  const hasPendingSync = dirtyState.profile || dirtyState.verifications || dirtyState.attestations

  return { dirtyState, hasPendingSync }
}
