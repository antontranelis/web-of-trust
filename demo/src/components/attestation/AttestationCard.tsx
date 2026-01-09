import { useState } from 'react'
import { Award, User, Calendar, Copy, Check } from 'lucide-react'
import type { Attestation } from '../../types'

interface AttestationCardProps {
  attestation: Attestation
  issuerName?: string
  subjectName?: string
  showIssuer?: boolean
  showExport?: boolean
}

const typeLabels: Record<string, string> = {
  skill: 'Fähigkeit',
  help: 'Hilfe',
  collaboration: 'Zusammenarbeit',
  recommendation: 'Empfehlung',
  custom: 'Sonstiges',
}

const typeColors: Record<string, string> = {
  skill: 'bg-blue-100 text-blue-700',
  help: 'bg-green-100 text-green-700',
  collaboration: 'bg-purple-100 text-purple-700',
  recommendation: 'bg-amber-100 text-amber-700',
  custom: 'bg-slate-100 text-slate-700',
}

export function AttestationCard({
  attestation,
  issuerName,
  subjectName,
  showIssuer = true,
  showExport = false,
}: AttestationCardProps) {
  const [copied, setCopied] = useState(false)
  const shortIssuerDid = attestation.issuerDid.slice(0, 12) + '...'
  const shortSubjectDid = attestation.subjectDid.slice(0, 12) + '...'

  const handleExport = async () => {
    const encoded = btoa(JSON.stringify(attestation))
    await navigator.clipboard.writeText(encoded)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-primary-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[attestation.type]}`}>
              {typeLabels[attestation.type]}
            </span>
            {attestation.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-slate-900 mb-2">{attestation.content}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {showIssuer && (
              <span className="flex items-center gap-1">
                <User size={12} />
                Von: {issuerName || shortIssuerDid}
              </span>
            )}
            <span className="flex items-center gap-1">
              <User size={12} />
              Für: {subjectName || shortSubjectDid}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(attestation.createdAt).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>

        {showExport && (
          <button
            onClick={handleExport}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Attestation exportieren"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
