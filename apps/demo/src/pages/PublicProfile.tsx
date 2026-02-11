import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, Shield, UserPlus, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { ProfileService, type PublicProfile as PublicProfileType } from '@real-life/wot-core'
import { Avatar } from '../components/shared'
import { useContacts } from '../hooks'

const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL ?? 'http://localhost:8788'

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error'

export function PublicProfile() {
  const { did } = useParams<{ did: string }>()
  const { activeContacts, pendingContacts } = useContacts()
  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [copiedDid, setCopiedDid] = useState(false)

  const decodedDid = did ? decodeURIComponent(did) : ''

  // Check if this DID is already a contact
  const allContacts = [...activeContacts, ...pendingContacts]
  const existingContact = allContacts.find((c) => c.did === decodedDid)

  useEffect(() => {
    if (!decodedDid) {
      setState('error')
      return
    }

    async function fetchProfile() {
      setState('loading')
      try {
        const res = await fetch(
          `${PROFILE_SERVICE_URL}/p/${encodeURIComponent(decodedDid)}`,
        )
        if (res.status === 404) {
          setState('not-found')
          return
        }
        if (!res.ok) {
          setState('error')
          return
        }

        const jws = await res.text()
        const result = await ProfileService.verifyProfile(jws)
        if (result.valid && result.profile) {
          setProfile(result.profile)
          setState('loaded')
        } else {
          setState('error')
        }
      } catch {
        setState('error')
      }
    }

    fetchProfile()
  }, [decodedDid])

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

      {/* Verification status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            Dieses Profil ist kryptographisch signiert und verifiziert.
            Die Signatur beweist, dass es vom Inhaber der DID erstellt wurde.
          </div>
        </div>
      </div>

      {/* Contact status */}
      {existingContact ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <span className="text-sm text-blue-800">
                {existingContact.status === 'active'
                  ? 'Verifizierter Kontakt'
                  : 'Ausstehender Kontakt'}
              </span>
            </div>
            <Link
              to="/contacts"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Kontakte ansehen
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-slate-500" />
              <span className="text-sm text-slate-600">
                Noch kein Kontakt
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
