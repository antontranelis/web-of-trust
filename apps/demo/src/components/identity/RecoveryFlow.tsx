import { useState } from 'react'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { SecureWotIdentity } from '@real-life/wot-core'

interface RecoveryFlowProps {
  onComplete: (identity: SecureWotIdentity, did: string) => void
  onCancel: () => void
}

export function RecoveryFlow({ onComplete, onCancel }: RecoveryFlowProps) {
  const [mnemonic, setMnemonic] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRecover = async () => {
    const words = mnemonic.trim().split(/\s+/)
    if (words.length !== 12) {
      setError('Bitte gib genau 12 Wörter ein')
      return
    }

    if (!passphrase) {
      setError('Bitte gib deine Passphrase ein')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const identity = new SecureWotIdentity()
      await identity.unlock(mnemonic.trim(), passphrase)

      const did = identity.getDid()

      // Store seed for future use
      await identity.deleteStoredIdentity() // Clear any old identity
      const result = await identity.create(passphrase) // This will store the seed

      // Verify same DID
      if (result.did !== did) {
        throw new Error('DID mismatch - Recovery failed')
      }

      onComplete(identity, did)
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('Invalid mnemonic')) {
          setError('Ungültige Recovery Phrase. Bitte prüfe die Wörter.')
        } else if (e.message.includes('passphrase')) {
          setError('Falsche Passphrase')
        } else {
          setError(e.message)
        }
      } else {
        setError('Fehler bei der Wiederherstellung')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Identität wiederherstellen
          </h1>
          <p className="text-slate-600">
            Gib deine 12-Wort Recovery Phrase und Passphrase ein, um deine Identität wiederherzustellen.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recovery Phrase (12 Wörter)
            </label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
              placeholder="Wort1 Wort2 Wort3 ..."
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500">
              Trenne die Wörter mit Leerzeichen
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deine Passphrase"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassphrase ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleRecover}
              disabled={isLoading || !mnemonic || !passphrase}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Wiederherstelle...' : 'Wiederherstellen'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <strong>Hinweis:</strong> Nach erfolgreicher Wiederherstellung wird deine Identität auf diesem Gerät gespeichert. Du musst dann nur noch deine Passphrase eingeben.
        </div>
      </div>
    </div>
  )
}
