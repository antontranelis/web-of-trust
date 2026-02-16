import { useState, useEffect, useMemo } from 'react'
import { Users, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useContacts, useAttestations, useVerificationStatus, useVerification, useGraphCache } from '../../hooks'
import { useIdentity, useAdapters } from '../../context'
import { ContactCard } from './ContactCard'
import { Avatar } from '../shared/Avatar'
import type { PublicProfile, Verification } from '@real-life/wot-core'

/**
 * Card for an unreciprocated incoming verification.
 * Shows the sender's profile and a button to counter-verify.
 */
function PendingVerificationCard({ verification, onCounterVerify }: {
  verification: Verification
  onCounterVerify: (did: string, name?: string) => Promise<void>
}) {
  const { discovery } = useAdapters()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    discovery.resolveProfile(verification.from)
      .then((p) => { if (!cancelled && p) setProfile(p) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [verification.from, discovery])

  const name = profile?.name || verification.from.slice(-12)
  const shortDid = verification.from.slice(0, 12) + '...' + verification.from.slice(-6)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onCounterVerify(verification.from, profile?.name)
    } catch (e) {
      console.error('Counter-verification failed:', e)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-4">
      <div className="flex items-start gap-3">
        <Link to={`/p/${encodeURIComponent(verification.from)}`}>
          <Avatar name={profile?.name} avatar={profile?.avatar} size="sm" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/p/${encodeURIComponent(verification.from)}`}
              className="font-medium text-slate-900 truncate hover:text-primary-600 transition-colors"
            >
              {name}
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Hat dich verifiziert
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono truncate">{shortDid}</p>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(verification.timestamp).toLocaleDateString('de-DE')}
          </p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
          title="Gegen-Verifizierung senden"
        >
          <ShieldCheck size={16} />
          {loading ? '...' : 'Bestätigen'}
        </button>
      </div>
    </div>
  )
}

export function ContactList() {
  const { activeContacts, pendingContacts, isLoading, removeContact } = useContacts()
  const { attestations } = useAttestations()
  const { getStatus, allVerifications } = useVerificationStatus()
  const { did } = useIdentity()
  const { counterVerify } = useVerification()
  const { getEntry } = useGraphCache()

  const getAttestationCount = (contactDid: string) => {
    // Prefer graph cache count, fall back to local attestations
    const entry = getEntry(contactDid)
    if (entry) return entry.attestationCount
    return attestations.filter((a) => a.to === contactDid).length
  }

  const getVerificationCount = (contactDid: string) => {
    const entry = getEntry(contactDid)
    return entry?.verificationCount
  }

  // Incoming verifications where I haven't counter-verified yet
  // AND the sender is not already in my contacts
  const unreciplocatedVerifications = useMemo(() => {
    if (!did) return []
    const contactDids = new Set([...activeContacts, ...pendingContacts].map(c => c.did))
    return allVerifications.filter(v => {
      if (v.to !== did) return false // not for me
      if (contactDids.has(v.from)) return false // already a contact
      const iCountered = allVerifications.some(c => c.from === did && c.to === v.from)
      return !iCountered
    })
  }, [did, allVerifications, activeContacts, pendingContacts])

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        Lade Kontakte...
      </div>
    )
  }

  if (activeContacts.length === 0 && pendingContacts.length === 0 && unreciplocatedVerifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Noch keine Kontakte</h3>
        <p className="text-slate-600 mb-4">
          Verifiziere Kontakte durch persönliche Treffen.
        </p>
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Jemanden verifizieren
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {unreciplocatedVerifications.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-3">
            Ausstehende Gegen-Verifizierung ({unreciplocatedVerifications.length})
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Diese Personen haben dich verifiziert. Bestätige, wenn du sie persönlich kennst.
          </p>
          <div className="space-y-2">
            {unreciplocatedVerifications.map((v) => (
              <PendingVerificationCard
                key={v.id}
                verification={v}
                onCounterVerify={counterVerify}
              />
            ))}
          </div>
        </section>
      )}

      {activeContacts.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Verifizierte Kontakte ({activeContacts.length})
          </h2>
          <div className="space-y-2">
            {activeContacts.map((contact) => (
              <ContactCard
                key={contact.did}
                contact={contact}
                verificationCount={getVerificationCount(contact.did)}
                attestationCount={getAttestationCount(contact.did)}
                verificationStatus={getStatus(contact.did)}
              />
            ))}
          </div>
        </section>
      )}

      {pendingContacts.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Ausstehende Kontakte ({pendingContacts.length})
          </h2>
          <div className="space-y-2">
            {pendingContacts.map((contact) => (
              <ContactCard
                key={contact.did}
                contact={contact}
                onRemove={() => removeContact(contact.did)}
                attestationCount={0}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
