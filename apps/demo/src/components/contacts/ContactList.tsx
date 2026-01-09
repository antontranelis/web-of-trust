import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useContacts, useAttestations } from '../../hooks'
import { ContactCard } from './ContactCard'

export function ContactList() {
  const { verifiedContacts, hiddenContacts, isLoading, hideContact, unhideContact, removeContact } = useContacts()
  const { attestations } = useAttestations()

  const getAttestationCount = (did: string) => {
    return attestations.filter((a) => a.subjectDid === did).length
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        Lade Kontakte...
      </div>
    )
  }

  if (verifiedContacts.length === 0 && hiddenContacts.length === 0) {
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
      {verifiedContacts.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Verifizierte Kontakte ({verifiedContacts.length})
          </h2>
          <div className="space-y-2">
            {verifiedContacts.map((contact) => (
              <ContactCard
                key={contact.did}
                contact={contact}
                onHide={() => hideContact(contact.did)}
                attestationCount={getAttestationCount(contact.did)}
              />
            ))}
          </div>
        </section>
      )}

      {hiddenContacts.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Ausgeblendete Kontakte ({hiddenContacts.length})
          </h2>
          <div className="space-y-2">
            {hiddenContacts.map((contact) => (
              <ContactCard
                key={contact.did}
                contact={contact}
                onUnhide={() => unhideContact(contact.did)}
                onRemove={() => removeContact(contact.did)}
                attestationCount={getAttestationCount(contact.did)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
