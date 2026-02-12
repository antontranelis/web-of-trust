import { useState, useEffect, useCallback } from 'react'
import { Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAttestations, useContacts, useProfileSync } from '../../hooks'
import { useIdentity, useAdapters } from '../../context'
import { AttestationCard } from './AttestationCard'

export function AttestationList() {
  const { myAttestations, receivedAttestations, isLoading, setAttestationAccepted } = useAttestations()
  const { contacts } = useContacts()
  const { did: myDid } = useIdentity()
  const { storage } = useAdapters()
  const { uploadVerificationsAndAttestations } = useProfileSync()
  const [publicMap, setPublicMap] = useState<Record<string, boolean>>({})

  // Load metadata for all received attestations
  useEffect(() => {
    async function loadMetadata() {
      const map: Record<string, boolean> = {}
      for (const att of receivedAttestations) {
        const meta = await storage.getAttestationMetadata(att.id)
        map[att.id] = meta?.accepted ?? false
      }
      setPublicMap(map)
    }
    loadMetadata()
  }, [receivedAttestations, storage])

  const handleTogglePublic = useCallback(async (attestationId: string, publish: boolean) => {
    await setAttestationAccepted(attestationId, publish)
    setPublicMap(prev => ({ ...prev, [attestationId]: publish }))
    // Re-upload to profile service so public profile reflects the change
    uploadVerificationsAndAttestations()
  }, [setAttestationAccepted, uploadVerificationsAndAttestations])

  const getContactName = (did: string) => {
    if (myDid === did) return 'Ich'
    const contact = contacts.find((c) => c.did === did)
    return contact?.name
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        Lade Attestationen...
      </div>
    )
  }

  if (myAttestations.length === 0 && receivedAttestations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Noch keine Attestationen</h3>
        <p className="text-slate-600 mb-4">
          Erstelle Attestationen für deine verifizierten Kontakte.
        </p>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Zu den Kontakten
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {myAttestations.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Von mir erstellt ({myAttestations.length})
          </h2>
          <div className="space-y-2">
            {myAttestations.map((attestation) => (
              <AttestationCard
                key={attestation.id}
                attestation={attestation}
                fromName={getContactName(attestation.from)}
                toName={getContactName(attestation.to)}
                showFrom={false}
                showExport={true}
              />
            ))}
          </div>
        </section>
      )}

      {receivedAttestations.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Über mich ({receivedAttestations.length})
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Veröffentlichte Attestationen erscheinen auf deinem öffentlichen Profil.
          </p>
          <div className="space-y-2">
            {receivedAttestations.map((attestation) => (
              <AttestationCard
                key={attestation.id}
                attestation={attestation}
                fromName={getContactName(attestation.from)}
                toName={getContactName(attestation.to)}
                isPublic={publicMap[attestation.id] ?? false}
                onTogglePublic={handleTogglePublic}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
