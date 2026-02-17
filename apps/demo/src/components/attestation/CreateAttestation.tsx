import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Award } from 'lucide-react'
import { useAttestations, useContacts } from '../../hooks'
import { useLanguage } from '../../i18n'

export function CreateAttestation() {
  const { t, fmt } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toDid = searchParams.get('to')

  const { createAttestation, isLoading } = useAttestations()
  const { activeContacts } = useContacts()

  const [selectedContact, setSelectedContact] = useState(toDid || '')
  const [claim, setClaim] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContact) {
      setError(t.createAttestation.errorNoContact)
      return
    }

    if (!claim.trim()) {
      setError(t.createAttestation.errorNoClaim)
      return
    }

    try {
      setError(null)
      const tagList = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      await createAttestation(selectedContact, claim.trim(), tagList.length > 0 ? tagList : undefined)
      navigate('/attestations')
    } catch (e) {
      setError(e instanceof Error ? e.message : t.createAttestation.errorCreationFailed)
    }
  }

  const selectedContactInfo = activeContacts.find((c) => c.did === selectedContact)

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={18} />
        {t.common.back}
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{t.createAttestation.title}</h1>
        <p className="text-slate-600">
          {t.createAttestation.subtitle}
        </p>
      </div>

      {activeContacts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600">
            {t.createAttestation.noContactsMessage}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.createAttestation.forWhomLabel}
            </label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">{t.createAttestation.selectContactPlaceholder}</option>
              {activeContacts.map((contact) => (
                <option key={contact.did} value={contact.did}>
                  {contact.name || contact.did.slice(0, 20) + '...'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.createAttestation.claimLabel}
            </label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder={fmt(t.createAttestation.claimPlaceholder, { name: selectedContactInfo?.name || t.createAttestation.thisPerson })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-24"
            />
            <p className="text-xs text-slate-500 mt-1">
              {t.createAttestation.claimHint}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.createAttestation.tagsLabel}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t.createAttestation.tagsPlaceholder}
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
            {isLoading ? t.createAttestation.creating : t.createAttestation.submitButton}
          </button>
        </form>
      )}
    </div>
  )
}
