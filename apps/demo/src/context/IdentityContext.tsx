import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { WotIdentity } from '@real-life/wot-core'

interface IdentityContextValue {
  identity: WotIdentity | null
  did: string | null
  hasStoredIdentity: boolean | null // null = loading, true/false = checked
  setIdentity: (identity: WotIdentity, did: string) => void
  clearIdentity: () => void
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<WotIdentity | null>(null)
  const [did, setDid] = useState<string | null>(null)
  const [hasStoredIdentity, setHasStoredIdentity] = useState<boolean | null>(null)

  // Check on mount: try session-key auto-unlock, then fall back to checking stored identity
  useEffect(() => {
    const initIdentity = async () => {
      try {
        const tempIdentity = new WotIdentity()
        const hasStored = await tempIdentity.hasStoredIdentity()

        if (hasStored) {
          // Try auto-unlock with cached session key
          const hasSession = await tempIdentity.hasActiveSession()
          if (hasSession) {
            try {
              await tempIdentity.unlockFromStorage()
              const newDid = tempIdentity.getDid()
              setIdentityState(tempIdentity)
              setDid(newDid)
              setHasStoredIdentity(true)
              return
            } catch {
              // Session expired or invalid — fall through to passphrase prompt
            }
          }
        }

        setHasStoredIdentity(hasStored)
      } catch (error) {
        console.error('Error checking stored identity:', error)
        setHasStoredIdentity(false)
      }
    }

    initIdentity()
  }, [])

  const setIdentity = (newIdentity: WotIdentity, newDid: string) => {
    setIdentityState(newIdentity)
    setDid(newDid)
    setHasStoredIdentity(true)
  }

  const clearIdentity = () => {
    setIdentityState(null)
    setDid(null)
    setHasStoredIdentity(false)
  }

  return (
    <IdentityContext.Provider
      value={{
        identity,
        did,
        hasStoredIdentity,
        setIdentity,
        clearIdentity,
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
