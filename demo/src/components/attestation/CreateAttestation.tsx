import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Award } from 'lucide-react'
import { useAttestations, useContacts } from '../../hooks'
import type { AttestationType } from '../../types'

const attestationTypes: { value: AttestationType; label: string; description: string }[] = [
  { value: 'skill', label: 'Fähigkeit', description: 'Bestätige eine Fähigkeit dieser Person' },
  { value: 'help', label: 'Hilfe', description: 'Diese Person hat dir geholfen' },
  { value: 'collaboration', label: 'Zusammenarbeit', description: 'Ihr habt zusammen gearbeitet' },
  { value: 'recommendation', label: 'Empfehlung', description: 'Du empfiehlst diese Person' },
  { value: 'custom', label: 'Sonstiges', description: 'Andere Art von Attestation' },
]

export function CreateAttestation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subjectDid = searchParams.get('subject')

  const { createAttestation, isLoading } = useAttestations()
  const { verifiedContacts } = useContacts()

  const [selectedContact, setSelectedContact] = useState(subjectDid || '')
  const [type, setType] = useState<AttestationType>('skill')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContact) {
      setError('Bitte wähle einen Kontakt aus')
      return
    }

    if (!content.trim()) {
      setError('Bitte gib einen Text ein')
      return
    }

    try {
      setError(null)
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      await createAttestation(selectedContact, type, content.trim(), tagList.length > 0 ? tagList : undefined)
      navigate('/attestations')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen')
    }
  }

  const selectedContactInfo = verifiedContacts.find((c) => c.did === selectedContact)

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={18} />
        Zurück
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Attestation erstellen</h1>
        <p className="text-slate-600">
          Erstelle eine Attestation für einen verifizierten Kontakt.
        </p>
      </div>

      {verifiedContacts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600">
            Du hast noch keine verifizierten Kontakte. Verifiziere zuerst einen Kontakt.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Für wen?
            </label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Kontakt auswählen...</option>
              {verifiedContacts.map((contact) => (
                <option key={contact.did} value={contact.did}>
                  {contact.profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Art der Attestation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {attestationTypes.map((at) => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setType(at.value)}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    type === at.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-medium text-slate-900">{at.label}</span>
                  <span className="text-xs text-slate-500">{at.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Was möchtest du über ${selectedContactInfo?.profile.name || 'diese Person'} sagen?`}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags (optional, kommagetrennt)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="z.B. Garten, Handwerk, Kochen"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Erstelle...' : 'Attestation erstellen'}
          </button>
        </form>
      )}
    </div>
  )
}
