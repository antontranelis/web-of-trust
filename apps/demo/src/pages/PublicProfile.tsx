import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, Shield, UserPlus, Copy, Check, AlertCircle, Loader2, LogIn, Award, Users, WifiOff } from 'lucide-react'
import { HttpDiscoveryAdapter, type PublicProfile as PublicProfileType, type Verification, type Attestation, type Contact, type Identity, type Subscribable } from '@real-life/wot-core'
import { Avatar } from '../components/shared'
import { useLanguage, plural } from '../i18n'
import { useIdentity, useOptionalAdapters } from '../context'
import { useSubscribable } from '../hooks/useSubscribable'

/** Keep only the newest verification per sender DID */
function deduplicateByFrom(verifications: Verification[]): Verification[] {
  const byFrom = new Map<string, Verification>()
  for (const v of verifications) {
    const existing = byFrom.get(v.from)
    if (!existing || v.timestamp > existing.timestamp) {
      byFrom.set(v.from, v)
    }
  }
  return [...byFrom.values()]
}

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
  const { t, fmt, formatDate } = useLanguage()
  const { identity, did: myDid } = useIdentity()
  const isLoggedIn = identity !== null
  const adapters = useOptionalAdapters()
  const discovery = useMemo(() => adapters?.discovery ?? fallbackDiscovery, [adapters])
  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [attestations, setAttestations] = useState<Attestation[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [copiedDid, setCopiedDid] = useState(false)
  const [resolvedNames, setResolvedNames] = useState<Map<string, string>>(new Map())
  const [mutualContacts, setMutualContacts] = useState<string[]>([])

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
        const [profileResult, vData, aData] = await Promise.all([
          discovery.resolveProfile(decodedDid),
          discovery.resolveVerifications(decodedDid),
          discovery.resolveAttestations(decodedDid),
        ])

        if (!profileResult.profile) {
          if (profileResult.fromCache) {
            // Offline + no cache → try local data (own identity / contacts)
            if (tryLocalFallbackRef.current()) return
            setState('offline')
          } else {
            setState('not-found')
          }
          return
        }

        setProfile(profileResult.profile)
        // Deduplicate verifications by sender (keep newest per from-DID)
        const uniqueV = deduplicateByFrom(vData)
        setVerifications(uniqueV)
        setAttestations(aData)
        setState(profileResult.fromCache ? 'loaded-offline' : 'loaded')

        // Cache fresh data for offline use
        if (!profileResult.fromCache && adapters?.graphCacheStore) {
          adapters.graphCacheStore.cacheEntry(decodedDid, profileResult.profile, vData, aData).catch(() => {})
        }
      } catch {
        if (tryLocalFallbackRef.current()) return
        setState('error')
      }
    }

    fetchAll()
  }, [decodedDid, discovery, adapters?.graphCacheStore])

  // Resolve DID names and mutual contacts after data loads
  useEffect(() => {
    if (!adapters?.graphCacheStore || (verifications.length === 0 && attestations.length === 0)) return

    let cancelled = false

    async function resolveGraph() {
      const allDids = new Set<string>()
      for (const v of verifications) allDids.add(v.from)
      for (const a of attestations) allDids.add(a.from)

      if (allDids.size > 0) {
        const names = await adapters!.graphCacheStore.resolveNames([...allDids])
        if (!cancelled) setResolvedNames(names)
      }

      if (decodedDid && !isMyProfile) {
        const contactDids = contacts.filter(c => c.status === 'active').map(c => c.did)
        if (contactDids.length > 0) {
          const mutual = await adapters!.graphCacheStore.findMutualContacts(decodedDid, contactDids)
          if (!cancelled) setMutualContacts(mutual)
        }
      }
    }

    resolveGraph()
    return () => { cancelled = true }
  }, [verifications, attestations, adapters?.graphCacheStore, decodedDid, isMyProfile, contacts])

  const handleCopyDid = async () => {
    await navigator.clipboard.writeText(decodedDid)
    setCopiedDid(true)
    setTimeout(() => setCopiedDid(false), 2000)
  }

  const displayName = useCallback((targetDid: string): string => {
    const suffix = targetDid === myDid ? t.publicProfile.youSuffix : ''
    // Check if it's one of my contacts (they have local names)
    const contact = contacts.find(c => c.did === targetDid)
    if (contact?.name) return contact.name + suffix
    // Check graph cache
    const cached = resolvedNames.get(targetDid)
    if (cached) return cached + suffix
    // Fall back to short DID
    return shortDidLabel(targetDid) + suffix
  }, [contacts, resolvedNames, myDid])

  const isKnownContact = useCallback((targetDid: string): boolean => {
    if (targetDid === myDid) return true
    return contacts.some(c => c.did === targetDid && c.status === 'active')
  }, [contacts, myDid])

  const shortDid = decodedDid.length > 30
    ? `${decodedDid.slice(0, 16)}...${decodedDid.slice(-8)}`
    : decodedDid

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">{t.publicProfile.loading}</p>
      </div>
    )
  }

  if (state === 'not-found') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.publicProfile.title}</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">{t.publicProfile.notFoundTitle}</h2>
          <p className="text-sm text-slate-500 mb-4">
            {t.publicProfile.notFoundDescription}
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.publicProfile.title}</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <WifiOff size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">{t.publicProfile.offlineTitle}</h2>
          <p className="text-sm text-slate-500 mb-4">
            {t.publicProfile.offlineDescription}
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.publicProfile.title}</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">{t.publicProfile.errorTitle}</h2>
          <p className="text-sm text-slate-500">
            {t.publicProfile.errorDescription}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.publicProfile.publicTitle}</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <Avatar name={profile?.name} avatar={profile?.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {profile?.name || <span className="text-slate-400 italic font-normal">{t.publicProfile.unknown}</span>}
            </h2>
            {profile?.bio && (
              <p className="text-sm text-slate-600 mb-2">{profile.bio}</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 font-mono">{shortDid}</p>
              <button
                onClick={handleCopyDid}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title={t.publicProfile.copyDid}
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
              {t.publicProfile.offlineBanner}
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
              {t.publicProfile.verifiedBanner}
            </div>
          </div>
        </div>
      )}

      {/* Mutual contacts */}
      {mutualContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              {mutualContacts.length === 1
                ? fmt(t.publicProfile.mutualContactSingular, { name: displayName(mutualContacts[0]) })
                : fmt(t.publicProfile.mutualContactPlural, { count: mutualContacts.length, names: mutualContacts.map(d => displayName(d)).join(', ') })
              }
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
              {fmt(t.publicProfile.verifiedByCount, { count: verifications.length, personLabel: plural(verifications.length, t.common.personOne, t.common.personMany) })}
            </h3>
          </div>
          <div className="space-y-2">
            {verifications.map((v) => {
              const name = displayName(v.from)
              const known = isKnownContact(v.from)
              return (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <Link
                    to={`/p/${encodeURIComponent(v.from)}`}
                    className={`text-xs truncate hover:text-primary-600 transition-colors ${known ? 'text-slate-800 font-medium' : 'text-slate-600'}`}
                  >
                    {name}
                    {known && v.from !== myDid && <span className="text-blue-500 ml-1">{t.publicProfile.contactBadge}</span>}
                  </Link>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {formatDate(new Date(v.timestamp))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Attestations */}
      {attestations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-600" />
            <h3 className="text-sm font-medium text-slate-900">
              {fmt(t.publicProfile.attestationCount, { count: attestations.length, attestationLabel: plural(attestations.length, t.common.attestationOne, t.common.attestationMany) })}
            </h3>
          </div>
          <div className="space-y-3">
            {attestations.map((a) => {
              const name = displayName(a.from)
              const known = isKnownContact(a.from)
              return (
                <div key={a.id} className={`border-l-2 pl-3 ${known ? 'border-green-300' : 'border-amber-200'}`}>
                  <p className="text-sm text-slate-700">&ldquo;{a.claim}&rdquo;</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.common.from}{' '}
                    <Link
                      to={`/p/${encodeURIComponent(a.from)}`}
                      className={`hover:text-primary-600 transition-colors ${known ? 'text-slate-700 font-medium' : ''}`}
                    >
                      {name}
                    </Link>
                    {known && a.from !== myDid && <span className="text-green-600 ml-1">{t.publicProfile.yourContactBadge}</span>}
                    {' '}&middot; {formatDate(new Date(a.createdAt))}
                  </p>
                </div>
              )
            })}
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
                {t.publicProfile.joinCta}
              </span>
            </div>
            <Link
              to="/"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
            >
              {t.publicProfile.joinButton}
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
                {t.publicProfile.verifyPerson}
              </span>
            </div>
            <Link
              to="/verify"
              className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
            >
              {t.publicProfile.verifyButton}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
