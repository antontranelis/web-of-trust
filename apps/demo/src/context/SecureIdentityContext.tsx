import { createContext, useContext, useState, type ReactNode } from 'react'
import { SecureWotIdentity } from '@real-life/wot-core'

interface SecureIdentityContextValue {
  identity: SecureWotIdentity | null
  did: string | null
  setIdentity: (identity: SecureWotIdentity, did: string) => void
  clearIdentity: () => void
}

const SecureIdentityContext = createContext<SecureIdentityContextValue | null>(null)

export function SecureIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<SecureWotIdentity | null>(null)
  const [did, setDid] = useState<string | null>(null)

  const setIdentity = (newIdentity: SecureWotIdentity, newDid: string) => {
    setIdentityState(newIdentity)
    setDid(newDid)
  }

  const clearIdentity = () => {
    setIdentityState(null)
    setDid(null)
  }

  return (
    <SecureIdentityContext.Provider
      value={{
        identity,
        did,
        setIdentity,
        clearIdentity,
      }}
    >
      {children}
    </SecureIdentityContext.Provider>
  )
}

export function useSecureIdentity(): SecureIdentityContextValue {
  const context = useContext(SecureIdentityContext)
  if (!context) {
    throw new Error('useSecureIdentity must be used within a SecureIdentityProvider')
  }
  return context
}
