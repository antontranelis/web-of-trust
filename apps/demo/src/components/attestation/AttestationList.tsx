import { Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAttestations, useContacts, useIdentity } from '../../hooks'
import { AttestationCard } from './AttestationCard'

export function AttestationList() {
  const { myAttestations, receivedAttestations, isLoading } = useAttestations()
  const { contacts } = useContacts()
  const { identity } = useIdentity()

  const getContactName = (did: string) => {
    if (identity?.did === did) return identity.profile.name
    const contact = contacts.find((c) => c.did === did)
    return contact?.profile.name
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
                issuerName={getContactName(attestation.issuerDid)}
                subjectName={getContactName(attestation.subjectDid)}
                showIssuer={false}
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
          <div className="space-y-2">
            {receivedAttestations.map((attestation) => (
              <AttestationCard
                key={attestation.id}
                attestation={attestation}
                issuerName={getContactName(attestation.issuerDid)}
                subjectName={getContactName(attestation.subjectDid)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
