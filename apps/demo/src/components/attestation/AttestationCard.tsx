import { Award, User, Calendar, Globe, GlobeLock, Loader2, Clock, Check, CheckCheck, XCircle, RefreshCw } from 'lucide-react'
import type { Attestation } from '@real-life/wot-core'
import type { DeliveryStatus } from '../../services/AttestationService'
import { useLanguage } from '../../i18n'

interface AttestationCardProps {
  attestation: Attestation
  fromName?: string | undefined
  toName?: string | undefined
  showFrom?: boolean | undefined
  isPublic?: boolean | undefined
  onTogglePublic?: (attestationId: string, publish: boolean) => void
  deliveryStatus?: DeliveryStatus | undefined
  onRetry?: (attestationId: string) => void
}

function DeliveryIndicator({ status, onRetry, attestationId, t }: {
  status: DeliveryStatus
  onRetry?: ((id: string) => void) | undefined
  attestationId: string
  t: any
}) {
  switch (status) {
    case 'sending':
      return (
        <span className="text-blue-500" title={t.attestations.deliverySending}>
          <Loader2 size={16} className="animate-spin" />
        </span>
      )
    case 'queued':
      return (
        <div className="flex items-center gap-1">
          <span className="text-amber-500" title={t.attestations.deliveryQueued}>
            <Clock size={16} />
          </span>
          {onRetry && (
            <button
              onClick={() => onRetry(attestationId)}
              className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
              title={t.attestations.retryButton}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      )
    case 'delivered':
      return (
        <span className="text-stone-400" title={t.attestations.deliveryDelivered}>
          <Check size={16} />
        </span>
      )
    case 'acknowledged':
      return (
        <span className="text-stone-400" title={t.attestations.deliveryAcknowledged}>
          <CheckCheck size={16} />
        </span>
      )
    case 'failed':
      return (
        <div className="flex items-center gap-1">
          <span className="text-red-500" title={t.attestations.deliveryFailed}>
            <XCircle size={16} />
          </span>
          {onRetry && (
            <button
              onClick={() => onRetry(attestationId)}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title={t.attestations.retryButton}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      )
  }
}

export function AttestationCard({
  attestation,
  fromName,
  toName,
  showFrom = true,
  isPublic,
  onTogglePublic,
  deliveryStatus,
  onRetry,
}: AttestationCardProps) {
  const { t, formatDate } = useLanguage()
  const shortFromDid = attestation.from.slice(0, 20) + '...'
  const shortToDid = attestation.to.slice(0, 20) + '...'

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-4">
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
                  className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-stone-900 mb-2">{attestation.claim}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
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

        <div className="flex items-center gap-1">
          {deliveryStatus && (
            <DeliveryIndicator
              status={deliveryStatus}
              onRetry={onRetry}
              attestationId={attestation.id}
              t={t}
            />
          )}
          {onTogglePublic && (
            <button
              onClick={() => onTogglePublic(attestation.id, !isPublic)}
              className={`p-2 rounded-lg transition-colors ${
                isPublic
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
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
