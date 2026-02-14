import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  WebCryptoAdapter,
  WebSocketMessagingAdapter,
  HttpDiscoveryAdapter,
  OfflineFirstDiscoveryAdapter,
  type StorageAdapter,
  type ReactiveStorageAdapter,
  type CryptoAdapter,
  type MessagingAdapter,
  type DiscoveryAdapter,
  type MessagingState,
  type WotIdentity,
  type PublicProfile,
  type PublicVerificationsData,
  type PublicAttestationsData,
} from '@real-life/wot-core'
import {
  ContactService,
  VerificationService,
  AttestationService,
} from '../services'
import { EvoluStorageAdapter } from '../adapters/EvoluStorageAdapter'
import { EvoluDiscoverySyncStore } from '../adapters/EvoluDiscoverySyncStore'
import { createWotEvolu, isEvoluInitialized, getEvolu } from '../db'
import { useIdentity } from './IdentityContext'

const RELAY_URL = import.meta.env.VITE_RELAY_URL ?? 'wss://relay.utopia-lab.org'
const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL ?? 'http://localhost:8788'

interface AdapterContextValue {
  storage: StorageAdapter
  reactiveStorage: ReactiveStorageAdapter
  crypto: CryptoAdapter
  messaging: MessagingAdapter
  discovery: DiscoveryAdapter
  discoverySyncStore: EvoluDiscoverySyncStore
  messagingState: MessagingState
  contactService: ContactService
  verificationService: VerificationService
  attestationService: AttestationService
  syncDiscovery: () => Promise<void>
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
  const [initError, setInitError] = useState<string | null>(null)
  const [adapters, setAdapters] = useState<Omit<AdapterContextValue, 'isInitialized' | 'messagingState'> | null>(null)
  const [messagingState, setMessagingState] = useState<MessagingState>('disconnected')
  const { consumeInitialProfile } = useIdentity()

  useEffect(() => {
    let cancelled = false
    let messagingAdapter: WebSocketMessagingAdapter | null = null

    async function initAdapters() {
      try {
        const did = identity.getDid()
        const evolu = isEvoluInitialized()
          ? getEvolu()
          : await createWotEvolu(identity)

        const storage = new EvoluStorageAdapter(evolu, did)
        const crypto = new WebCryptoAdapter()
        messagingAdapter = new WebSocketMessagingAdapter(RELAY_URL)
        const httpDiscovery = new HttpDiscoveryAdapter(PROFILE_SERVICE_URL)
        const discoverySyncStore = new EvoluDiscoverySyncStore(evolu, did)
        const discovery = new OfflineFirstDiscoveryAdapter(httpDiscovery, discoverySyncStore)

        const attestationService = new AttestationService(storage, crypto)
        attestationService.setMessaging(messagingAdapter)

        // Ensure identity exists in Evolu.
        // On a new device (recovery/import), Evolu may still be syncing from relay,
        // so we wait briefly before deciding to create a fresh profile.
        let existing = await storage.getIdentity()
        if (!existing && did) {
          // Wait for Evolu relay sync before creating empty profile
          await new Promise(resolve => setTimeout(resolve, 2000))
          existing = await storage.getIdentity()
        }
        if (!existing && did) {
          const profile = consumeInitialProfile() ?? { name: '' }
          await storage.createIdentity(did, profile)
          // Mark profile dirty so syncDiscovery() uploads it to wot-profiles
          if (profile.name) {
            await discoverySyncStore.markDirty(did, 'profile')
          }
        }

        // syncDiscovery: retries all pending publish operations
        const syncDiscovery = async () => {
          try {
            await discovery.syncPending(did, identity, async () => {
              const localIdentity = await storage.getIdentity()
              const verifications = await storage.getReceivedVerifications()
              const allAttestations = await storage.getReceivedAttestations()
              const accepted = []
              for (const att of allAttestations) {
                const meta = await storage.getAttestationMetadata(att.id)
                if (meta?.accepted) accepted.push(att)
              }
              const result: {
                profile?: PublicProfile
                verifications?: PublicVerificationsData
                attestations?: PublicAttestationsData
              } = {}
              if (localIdentity) {
                result.profile = {
                  did,
                  name: localIdentity.profile.name,
                  ...(localIdentity.profile.bio ? { bio: localIdentity.profile.bio } : {}),
                  ...(localIdentity.profile.avatar ? { avatar: localIdentity.profile.avatar } : {}),
                  updatedAt: new Date().toISOString(),
                }
              }
              if (verifications.length > 0) {
                result.verifications = { did, verifications, updatedAt: new Date().toISOString() }
              }
              if (accepted.length > 0) {
                result.attestations = { did, attestations: accepted, updatedAt: new Date().toISOString() }
              }
              return result
            })
          } catch (error) {
            console.warn('Discovery sync failed:', error)
          }
        }

        if (!cancelled) {
          setAdapters({
            storage,
            reactiveStorage: storage,
            crypto,
            messaging: messagingAdapter,
            discovery,
            discoverySyncStore,
            contactService: new ContactService(storage),
            verificationService: new VerificationService(storage),
            attestationService,
            syncDiscovery,
          })
          setIsInitialized(true)

          // Connect to relay after adapters are set
          if (did && !cancelled) {
            // Track adapter state changes (disconnect, reconnect)
            messagingAdapter.onStateChange((state) => {
              if (!cancelled) setMessagingState(state)
            })

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
        console.error('Failed to initialize adapters:', error)
        if (!cancelled) {
          const msg = error instanceof Error ? error.message : String(error)
          if (msg.includes('opfs') || msg.includes('storage') || msg.includes('access') || msg.includes('SecurityError')) {
            setInitError('storage-blocked')
          } else {
            setInitError(msg)
          }
        }
      }
    }

    initAdapters()
    return () => {
      cancelled = true
      messagingAdapter?.disconnect()
    }
  }, [identity])

  if (initError) {
    const isStorageBlocked = initError === 'storage-blocked'
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">&#9888;&#65039;</div>
          <h2 className="text-xl font-semibold text-slate-800">
            {isStorageBlocked ? 'Speicherzugriff blockiert' : 'Initialisierung fehlgeschlagen'}
          </h2>
          <p className="text-slate-600">
            {isStorageBlocked
              ? 'Die App benötigt Zugriff auf den lokalen Speicher, um deine Identität und Daten sicher auf deinem Gerät zu speichern. Bitte erlaube den Zugriff in den Browser-Einstellungen und lade die Seite neu.'
              : `Fehler: ${initError}`
            }
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    )
  }

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
