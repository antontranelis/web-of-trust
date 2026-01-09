import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAdapters } from './AdapterContext'
import type { Identity, Profile, KeyPair } from '../types'

interface IdentityContextValue {
  identity: Identity | null
  keyPair: KeyPair | null
  isLoading: boolean
  error: Error | null
  hasIdentity: boolean
  createIdentity: (profile: Profile) => Promise<Identity>
  updateProfile: (profile: Profile) => Promise<void>
  deleteIdentity: () => Promise<void>
  refresh: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { identityService } = useAdapters()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadIdentity = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [id, kp] = await Promise.all([
        identityService.getIdentity(),
        identityService.getKeyPair(),
      ])
      setIdentity(id)
      setKeyPair(kp)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load identity'))
    } finally {
      setIsLoading(false)
    }
  }, [identityService])

  useEffect(() => {
    loadIdentity()
  }, [loadIdentity])

  const createIdentity = useCallback(
    async (profile: Profile) => {
      try {
        setIsLoading(true)
        setError(null)
        const newIdentity = await identityService.createIdentity(profile)
        const kp = await identityService.getKeyPair()
        setIdentity(newIdentity)
        setKeyPair(kp)
        return newIdentity
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to create identity')
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [identityService]
  )

  const updateProfile = useCallback(
    async (profile: Profile) => {
      try {
        setError(null)
        await identityService.updateProfile(profile)
        await loadIdentity()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to update profile')
        setError(err)
        throw err
      }
    },
    [identityService, loadIdentity]
  )

  const deleteIdentity = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await identityService.deleteIdentity()
      setIdentity(null)
      setKeyPair(null)
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to delete identity')
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [identityService])

  return (
    <IdentityContext.Provider
      value={{
        identity,
        keyPair,
        isLoading,
        error,
        hasIdentity: identity !== null,
        createIdentity,
        updateProfile,
        deleteIdentity,
        refresh: loadIdentity,
      }}
    >
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext)
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider')
  }
  return context
}
