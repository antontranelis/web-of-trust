import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  WebCryptoAdapter,
  WebSocketMessagingAdapter,
  HttpDiscoveryAdapter,
  type StorageAdapter,
  type ReactiveStorageAdapter,
  type CryptoAdapter,
  type MessagingAdapter,
  type DiscoveryAdapter,
  type MessagingState,
  type WotIdentity,
} from '@real-life/wot-core'
import {
  ContactService,
  VerificationService,
  AttestationService,
} from '../services'
import { EvoluStorageAdapter } from '../adapters/EvoluStorageAdapter'
import { createWotEvolu, isEvoluInitialized, getEvolu } from '../db'

const RELAY_URL = import.meta.env.VITE_RELAY_URL ?? 'wss://relay.utopia-lab.org'
const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL ?? 'http://localhost:8788'

interface AdapterContextValue {
  storage: StorageAdapter
  reactiveStorage: ReactiveStorageAdapter
  crypto: CryptoAdapter
  messaging: MessagingAdapter
  discovery: DiscoveryAdapter
  messagingState: MessagingState
  contactService: ContactService
  verificationService: VerificationService
  attestationService: AttestationService
  isInitialized: boolean
}

const AdapterContext = createContext<AdapterContextValue | null>(null)

interface AdapterProviderProps {
  children: ReactNode
  identity: WotIdentity
}

/**
 * AdapterProvider initializes Evolu with WotIdentity-derived custom keys.
 * The identity must be unlocked before this provider is rendered.
 */
export function AdapterProvider({ children, identity }: AdapterProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [adapters, setAdapters] = useState<Omit<AdapterContextValue, 'isInitialized' | 'messagingState'> | null>(null)
  const [messagingState, setMessagingState] = useState<MessagingState>('disconnected')

  useEffect(() => {
    let cancelled = false
    let messagingAdapter: WebSocketMessagingAdapter | null = null

    async function initEvolu() {
      try {
        const evolu = isEvoluInitialized()
          ? getEvolu()
          : await createWotEvolu(identity)

        const storage = new EvoluStorageAdapter(evolu)
        const crypto = new WebCryptoAdapter()
        messagingAdapter = new WebSocketMessagingAdapter(RELAY_URL)
        const discovery = new HttpDiscoveryAdapter(PROFILE_SERVICE_URL)

        const attestationService = new AttestationService(storage, crypto)
        attestationService.setMessaging(messagingAdapter)

        // Ensure identity exists — migrate localStorage profile to Evolu if needed
        const did = identity.getDid()
        const existing = await storage.getIdentity()
        if (!existing && did) {
          await storage.createIdentity(did, { name: '' })
        } else if (existing) {
          // Ensure profile is in Evolu (migration from localStorage-only era)
          await storage.updateIdentity(existing)
        }

        if (!cancelled) {
          setAdapters({
            storage,
            reactiveStorage: storage,
            crypto,
            messaging: messagingAdapter,
            discovery,
            contactService: new ContactService(storage),
            verificationService: new VerificationService(storage),
            attestationService,
          })
          setIsInitialized(true)

          // Connect to relay after adapters are set
          const did = identity.getDid()
          if (did && !cancelled) {
            try {
              setMessagingState('connecting')
              await messagingAdapter.connect(did)
              if (!cancelled) setMessagingState('connected')
              console.log(`Relay connected: ${RELAY_URL} (${did.slice(0, 20)}...)`)
            } catch (error) {
              console.warn('Relay connection failed:', error)
              if (!cancelled) setMessagingState('error')
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize Evolu:', error)
      }
    }

    initEvolu()
    return () => {
      cancelled = true
      messagingAdapter?.disconnect()
    }
  }, [identity])

  if (!isInitialized || !adapters) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Initialisiere Evolu...</div>
      </div>
    )
  }

  return (
    <AdapterContext.Provider value={{ ...adapters, messagingState, isInitialized }}>
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

export function useOptionalAdapters(): AdapterContextValue | null {
  return useContext(AdapterContext)
}
