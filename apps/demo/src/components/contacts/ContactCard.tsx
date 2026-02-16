import { Shield, ShieldCheck, ShieldAlert, ArrowDownLeft, ArrowUpRight, Trash2, Award, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Contact } from '@real-life/wot-core'
import type { VerificationDirection } from '../../hooks/useVerificationStatus'
import { Avatar } from '../shared'

interface ContactCardProps {
  contact: Contact
  onRemove?: () => void
  verificationCount?: number | undefined
  attestationCount?: number
  verificationStatus?: VerificationDirection
}

const verificationInfo: Record<VerificationDirection, { label: string; color: string; icon: typeof Shield }> = {
  mutual: { label: 'Gegenseitig verifiziert', color: 'bg-green-100 text-green-700', icon: ShieldCheck },
  incoming: { label: 'Hat mich verifiziert', color: 'bg-blue-100 text-blue-700', icon: ArrowDownLeft },
  outgoing: { label: 'Von mir verifiziert', color: 'bg-amber-100 text-amber-700', icon: ArrowUpRight },
  none: { label: 'Nicht verifiziert', color: 'bg-slate-100 text-slate-500', icon: ShieldAlert },
}

export function ContactCard({ contact, onRemove, verificationCount, attestationCount = 0, verificationStatus = 'none' }: ContactCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: verificationInfo[verificationStatus].color,
  }

  const statusLabels = {
    pending: 'Ausstehend',
    active: verificationInfo[verificationStatus].label,
  }

  const shortDid = contact.did.slice(0, 12) + '...' + contact.did.slice(-6)
  const displayName = contact.name || shortDid

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <Link to={`/p/${encodeURIComponent(contact.did)}`}>
          <Avatar name={contact.name} avatar={contact.avatar} size="sm" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/p/${encodeURIComponent(contact.did)}`} className="font-medium text-slate-900 truncate hover:text-primary-600 transition-colors">
              {displayName}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[contact.status]}`}>
              {statusLabels[contact.status]}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono truncate">{shortDid}</p>

          {contact.status === 'active' && (
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              {contact.verifiedAt && (() => {
                const StatusIcon = verificationInfo[verificationStatus].icon
                return (
                  <span className="flex items-center gap-1">
                    <StatusIcon size={12} />
                    {new Date(contact.verifiedAt).toLocaleDateString('de-DE')}
                  </span>
                )
              })()}
              {verificationCount != null && verificationCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {verificationCount} Verifikation{verificationCount !== 1 ? 'en' : ''}
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
