import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useContacts, useAttestations, useVerificationStatus } from '../../hooks'
import { ContactCard } from './ContactCard'

export function ContactList() {
  const { activeContacts, pendingContacts, isLoading, removeContact } = useContacts()
  const { attestations } = useAttestations()
  const { getStatus } = useVerificationStatus()

  const getAttestationCount = (did: string) => {
    return attestations.filter((a) => a.to === did).length
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        Lade Kontakte...
      </div>
    )
  }

  if (activeContacts.length === 0 && pendingContacts.length === 0) {
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
