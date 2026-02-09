import { Shield, Trash2, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Contact } from '@real-life/wot-core'
import { Avatar } from '../shared'

interface ContactCardProps {
  contact: Contact
  onRemove?: () => void
  attestationCount?: number
}

export function ContactCard({ contact, onRemove, attestationCount = 0 }: ContactCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
  }

  const statusLabels = {
    pending: 'Ausstehend',
    active: 'Verifiziert',
  }

  const shortDid = contact.did.slice(0, 12) + '...' + contact.did.slice(-6)
  const displayName = contact.name || shortDid

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={contact.name} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900 truncate">{displayName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[contact.status]}`}>
              {statusLabels[contact.status]}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono truncate">{shortDid}</p>

          {contact.status === 'active' && (
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              {contact.verifiedAt && (
                <span className="flex items-center gap-1">
                  <Shield size={12} />
                  {new Date(contact.verifiedAt).toLocaleDateString('de-DE')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Award size={12} />
                {attestationCount} Attestation{attestationCount !== 1 ? 'en' : ''}
              </span>
            </div>
          )}
        </div>

        {contact.status === 'active' && (
          <div className="flex gap-1">
            <Link
              to={`/attestations/new?to=${contact.did}`}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Attestation erstellen"
            >
              <Award size={18} />
            </Link>
          </div>
        )}

        {contact.status === 'pending' && onRemove && (
          <div className="flex gap-1">
            <button
              onClick={onRemove}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Entfernen"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
