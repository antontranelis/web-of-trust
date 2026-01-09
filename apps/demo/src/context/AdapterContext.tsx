import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  LocalStorageAdapter,
  WebCryptoAdapter,
  NoOpSyncAdapter,
  type StorageAdapter,
  type CryptoAdapter,
  type SyncAdapter,
} from '@web-of-trust/core'
import {
  IdentityService,
  ContactService,
  VerificationService,
  AttestationService,
} from '../services'

interface AdapterContextValue {
  storage: StorageAdapter
  crypto: CryptoAdapter
  sync: SyncAdapter
  identityService: IdentityService
  contactService: ContactService
  verificationService: VerificationService
  attestationService: AttestationService
  isInitialized: boolean
}

const AdapterContext = createContext<AdapterContextValue | null>(null)

interface AdapterProviderProps {
  children: ReactNode
}

export function AdapterProvider({ children }: AdapterProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [adapters] = useState(() => {
    const storage = new LocalStorageAdapter()
    const crypto = new WebCryptoAdapter()
    const sync = new NoOpSyncAdapter()

    return {
      storage,
      crypto,
      sync,
      identityService: new IdentityService(storage, crypto),
      contactService: new ContactService(storage),
      verificationService: new VerificationService(storage, crypto),
      attestationService: new AttestationService(storage, crypto),
    }
  })

  useEffect(() => {
    adapters.storage.init().then(() => {
      setIsInitialized(true)
    })
  }, [adapters.storage])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Initialisiere...</div>
      </div>
    )
  }

  return (
    <AdapterContext.Provider value={{ ...adapters, isInitialized }}>
      {children}
    </AdapterContext.Provider>
  )
}

export function useAdapters(): AdapterContextValue {
  const context = useContext(AdapterContext)
  if (!context) {
    throw new Error('useAdapters must be used within an AdapterProvider')
  }
  return context
}
