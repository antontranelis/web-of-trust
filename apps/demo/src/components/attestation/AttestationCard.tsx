import { Award, User, Calendar, Globe, GlobeLock } from 'lucide-react'
import type { Attestation } from '@real-life/wot-core'
import { useLanguage } from '../../i18n'

interface AttestationCardProps {
  attestation: Attestation
  fromName?: string | undefined
  toName?: string | undefined
  showFrom?: boolean | undefined
  isPublic?: boolean | undefined
  onTogglePublic?: (attestationId: string, publish: boolean) => void
}

export function AttestationCard({
  attestation,
  fromName,
  toName,
  showFrom = true,
  isPublic,
  onTogglePublic,
}: AttestationCardProps) {
  const { t, formatDate } = useLanguage()
  const shortFromDid = attestation.from.slice(0, 20) + '...'
  const shortToDid = attestation.to.slice(0, 20) + '...'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-primary-600" />
        </div>

        <div className="flex-1 min-w-0">
          {attestation.tags && attestation.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              {attestation.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-slate-900 mb-2">{attestation.claim}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {showFrom && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {t.attestations.fromLabel}{fromName || shortFromDid}
              </span>
            )}
            <span className="flex items-center gap-1">
              <User size={12} />
              {t.attestations.forLabel}{toName || shortToDid}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(new Date(attestation.createdAt))}
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          {onTogglePublic && (
            <button
              onClick={() => onTogglePublic(attestation.id, !isPublic)}
              className={`p-2 rounded-lg transition-colors ${
                isPublic
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isPublic ? t.attestations.attestationPublicTitle : t.attestations.attestationPrivateTitle}
            >
              {isPublic ? <Globe size={18} /> : <GlobeLock size={18} />}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
