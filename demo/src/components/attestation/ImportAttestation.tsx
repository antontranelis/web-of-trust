import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { useAttestations } from '../../hooks'

export function ImportAttestation() {
  const navigate = useNavigate()
  const { importAttestation } = useAttestations()
  const [code, setCode] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleImport = async () => {
    if (!code.trim()) {
      setError('Bitte einen Attestation-Code einfügen.')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      await importAttestation(code)
      setSuccess(true)
      setTimeout(() => {
        navigate('/attestations')
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import fehlgeschlagen')
    } finally {
      setIsImporting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Attestation importiert!</h2>
        <p className="text-slate-600">Die Attestation wurde erfolgreich gespeichert.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={() => navigate('/attestations')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Attestation importieren</h1>
            <p className="text-sm text-slate-500">Füge den Code ein, den du erhalten hast</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attestation-Code
            </label>
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(null)
              }}
              placeholder="Füge hier den Attestation-Code ein..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
              rows={6}
              disabled={isImporting}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={isImporting || !code.trim()}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importiere...' : 'Importieren & Verifizieren'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Die Signatur der Attestation wird automatisch geprüft.
          </p>
        </div>
      </div>
    </div>
  )
}
