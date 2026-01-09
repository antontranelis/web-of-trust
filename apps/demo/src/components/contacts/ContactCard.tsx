import { User, Shield, EyeOff, Eye, Trash2, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Contact } from '@web-of-trust/core'

interface ContactCardProps {
  contact: Contact
  onHide?: () => void
  onUnhide?: () => void
  onRemove?: () => void
  attestationCount?: number
}

export function ContactCard({ contact, onHide, onUnhide, onRemove, attestationCount = 0 }: ContactCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    verified: 'bg-green-100 text-green-700',
    hidden: 'bg-slate-100 text-slate-500',
  }

  const statusLabels = {
    pending: 'Ausstehend',
    verified: 'Verifiziert',
    hidden: 'Ausgeblendet',
  }

  const shortDid = contact.did.slice(0, 12) + '...' + contact.did.slice(-6)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-slate-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900 truncate">{contact.profile.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[contact.status]}`}>
              {statusLabels[contact.status]}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono truncate">{shortDid}</p>

          {contact.status === 'verified' && (
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

        {contact.status === 'verified' && (
          <div className="flex gap-1">
            <Link
              to={`/attestations/new?subject=${contact.did}`}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Attestation erstellen"
            >
              <Award size={18} />
            </Link>
            {onHide && (
              <button
                onClick={onHide}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Ausblenden"
              >
                <EyeOff size={18} />
              </button>
            )}
          </div>
        )}

        {contact.status === 'hidden' && (
          <div className="flex gap-1">
            {onUnhide && (
              <button
                onClick={onUnhide}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Wieder einblenden"
              >
                <Eye size={18} />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Entfernen"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
