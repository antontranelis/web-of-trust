import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, Shield, UserPlus, Copy, Check, AlertCircle, Loader2, LogIn, Award, Users, WifiOff } from 'lucide-react'
import { HttpDiscoveryAdapter, type PublicProfile as PublicProfileType, type Verification, type Attestation, type Contact, type Identity, type Subscribable } from '@real-life/wot-core'
import { Avatar } from '../components/shared'
import { useIdentity, useOptionalAdapters } from '../context'
import { useOnlineStatus } from '../hooks'
import { useSubscribable } from '../hooks/useSubscribable'

const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL ?? 'http://localhost:8788'
const fallbackDiscovery = new HttpDiscoveryAdapter(PROFILE_SERVICE_URL)

const EMPTY_CONTACTS: Subscribable<Contact[]> = { subscribe: () => () => {}, getValue: () => [] }
const EMPTY_IDENTITY: Subscribable<Identity | null> = { subscribe: () => () => {}, getValue: () => null }

type LoadState = 'loading' | 'loaded' | 'loaded-offline' | 'not-found' | 'offline' | 'error'

function shortDidLabel(did: string): string {
  return did.length > 24
    ? `${did.slice(0, 12)}...${did.slice(-6)}`
    : did
}

export function PublicProfile() {
  const { did } = useParams<{ did: string }>()
  const { identity, did: myDid } = useIdentity()
  const isLoggedIn = identity !== null
  const isOnline = useOnlineStatus()
  const adapters = useOptionalAdapters()
  const discovery = useMemo(() => adapters?.discovery ?? fallbackDiscovery, [adapters])
  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [attestations, setAttestations] = useState<Attestation[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [copiedDid, setCopiedDid] = useState(false)

  const decodedDid = did ? decodeURIComponent(did) : ''
  const isMyProfile = myDid === decodedDid

  // Reactive local data (contacts + own identity)
  const contactsSubscribable = useMemo(() => adapters?.reactiveStorage.watchContacts() ?? EMPTY_CONTACTS, [adapters])
  const contacts = useSubscribable(contactsSubscribable)
  const identitySubscribable = useMemo(() => adapters?.reactiveStorage.watchIdentity() ?? EMPTY_IDENTITY, [adapters])
  const localIdentity = useSubscribable(identitySubscribable)

  const isContact = useMemo(() => contacts.some(c => c.did === decodedDid), [contacts, decodedDid])

  const tryLocalFallback = useCallback((): boolean => {
    // Try own profile
    if (decodedDid === myDid && localIdentity) {
      setProfile({
        did: decodedDid,
        name: localIdentity.profile.name,
        ...(localIdentity.profile.bio ? { bio: localIdentity.profile.bio } : {}),
        ...(localIdentity.profile.avatar ? { avatar: localIdentity.profile.avatar } : {}),
        updatedAt: new Date().toISOString(),
      })
      setState('loaded-offline')
      return true
    }

    // Try contact data
    const contact = contacts.find(c => c.did === decodedDid)
    if (contact?.name) {
      setProfile({
        did: decodedDid,
        name: contact.name,
        ...(contact.bio ? { bio: contact.bio } : {}),
        ...(contact.avatar ? { avatar: contact.avatar } : {}),
        updatedAt: contact.updatedAt,
      })
      setState('loaded-offline')
      return true
    }

    return false
  }, [decodedDid, myDid, localIdentity, contacts])

  // Ref to access tryLocalFallback inside useEffect without it being a dependency.
  // This prevents reactive data changes (contacts, localIdentity) from re-triggering fetchAll.
  const tryLocalFallbackRef = useRef(tryLocalFallback)
  tryLocalFallbackRef.current = tryLocalFallback

  useEffect(() => {
    if (!decodedDid) {
      setState('error')
      return
    }

    async function fetchAll() {
      setState('loading')
      try {
        // Fetch profile, verifications, and attestations in parallel via DiscoveryAdapter
        const [profileData, vData, aData] = await Promise.all([
          discovery.resolveProfile(decodedDid),
          discovery.resolveVerifications(decodedDid),
          discovery.resolveAttestations(decodedDid),
        ])

        if (!profileData) {
          if (!navigator.onLine && tryLocalFallbackRef.current()) return
          setState(!navigator.onLine ? 'offline' : 'not-found')
          return
        }

        setProfile(profileData)
        setVerifications(vData)
        setAttestations(aData)
        setState('loaded')
      } catch (error) {
        const isNetworkError = error instanceof TypeError && /fetch|network/i.test(error.message)
        if ((isNetworkError || !navigator.onLine) && tryLocalFallbackRef.current()) return
        setState(isNetworkError || !navigator.onLine ? 'offline' : 'error')
      }
    }

    fetchAll()
  }, [decodedDid, discovery])

  const handleCopyDid = async () => {
    await navigator.clipboard.writeText(decodedDid)
    setCopiedDid(true)
    setTimeout(() => setCopiedDid(false), 2000)
  }

  const shortDid = decodedDid.length > 30
    ? `${decodedDid.slice(0, 16)}...${decodedDid.slice(-8)}`
    : decodedDid

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Profil wird geladen...</p>
      </div>
    )
  }

  if (state === 'not-found') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profil</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">Kein Profil gefunden</h2>
          <p className="text-sm text-slate-500 mb-4">
            Für diese DID wurde kein öffentliches Profil hinterlegt.
          </p>
          <p className="text-xs text-slate-400 font-mono break-all">{decodedDid}</p>
        </div>
      </div>
    )
  }

  if (state === 'offline') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profil</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <WifiOff size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">Du bist offline</h2>
          <p className="text-sm text-slate-500 mb-4">
            Das Profil kann nicht geladen werden, da keine Internetverbindung besteht.
          </p>
          <p className="text-xs text-slate-400 font-mono break-all">{decodedDid}</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profil</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">Fehler beim Laden</h2>
          <p className="text-sm text-slate-500">
            Das Profil konnte nicht geladen oder verifiziert werden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Öffentliches Profil</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <Avatar name={profile?.name} avatar={profile?.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {profile?.name || <span className="text-slate-400 italic font-normal">Unbekannt</span>}
            </h2>
            {profile?.bio && (
              <p className="text-sm text-slate-600 mb-2">{profile.bio}</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 font-mono">{shortDid}</p>
              <button
                onClick={handleCopyDid}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="DID kopieren"
              >
                {copiedDid ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {state === 'loaded-offline' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              Du bist offline. Die angezeigten Daten stammen aus dem lokalen Speicher
              und sind möglicherweise nicht aktuell.
            </div>
          </div>
        </div>
      )}

      {/* Verification status */}
      {state === 'loaded' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              Dieses Profil ist kryptographisch signiert und verifiziert.
              Die Signatur beweist, dass es vom Inhaber der DID erstellt wurde.
            </div>
          </div>
        </div>
      )}

      {/* Verifications */}
      {verifications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-blue-600" />
            <h3 className="text-sm font-medium text-slate-900">
              Verifiziert von {verifications.length} Person{verifications.length !== 1 ? 'en' : ''}
            </h3>
          </div>
          <div className="space-y-2">
            {verifications.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-mono text-xs">
                  {shortDidLabel(v.from)}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(v.timestamp).toLocaleDateString('de-DE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attestations */}
      {attestations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-600" />
            <h3 className="text-sm font-medium text-slate-900">
              {attestations.length} Attestation{attestations.length !== 1 ? 'en' : ''}
            </h3>
          </div>
          <div className="space-y-3">
            {attestations.map((a) => (
              <div key={a.id} className="border-l-2 border-amber-200 pl-3">
                <p className="text-sm text-slate-700">&ldquo;{a.claim}&rdquo;</p>
                <p className="text-xs text-slate-400 mt-1">
                  von {shortDidLabel(a.from)} &middot; {new Date(a.createdAt).toLocaleDateString('de-DE')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!isLoggedIn && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogIn size={16} className="text-primary-600" />
              <span className="text-sm text-primary-800">
                Dem Web of Trust beitreten
              </span>
            </div>
            <Link
              to="/"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
            >
              Jetzt starten
            </Link>
          </div>
        </div>
      )}
      {isLoggedIn && !isMyProfile && !isContact && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-slate-500" />
              <span className="text-sm text-slate-600">
                Person verifizieren
              </span>
            </div>
            <Link
              to="/verify"
              className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
            >
              Verifizieren
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
