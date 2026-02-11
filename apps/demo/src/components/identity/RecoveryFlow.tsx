import { useState } from 'react'
import { KeyRound, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { WotIdentity } from '@real-life/wot-core'
import { ProgressIndicator, InfoTooltip } from '../shared'

type RecoveryStep = 'import' | 'validate' | 'protect' | 'complete'

interface RecoveryFlowProps {
  onComplete: (identity: WotIdentity, did: string) => void
  onCancel: () => void
}

const STEPS = [
  { label: 'Importieren', description: 'Magische Wörter eingeben' },
  { label: 'Validieren', description: 'Wörter prüfen' },
  { label: 'Schützen', description: 'Neues Passwort' },
]

export function RecoveryFlow({ onComplete, onCancel }: RecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>('import')
  const [mnemonic, setMnemonic] = useState('')
  const [did, setDid] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [passphraseConfirm, setPassphraseConfirm] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getCurrentStepNumber = () => {
    const stepMap: Record<RecoveryStep, number> = {
      import: 1,
      validate: 2,
      protect: 3,
      complete: 3,
    }
    return stepMap[step]
  }

  const validateMnemonic = (text: string): boolean => {
    const words = text.trim().split(/\s+/)
    return words.length === 12 && words.every((word) => word.match(/^[a-z]+$/))
  }

  const handleValidate = async () => {
    const cleanMnemonic = mnemonic.trim().toLowerCase()
    const words = cleanMnemonic.split(/\s+/)

    if (words.length !== 12) {
      setError('Bitte gib genau 12 Wörter ein')
      return
    }

    if (!validateMnemonic(cleanMnemonic)) {
      setError('Ungültige Magische Wörter. Nur Kleinbuchstaben erlaubt.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Test if mnemonic is valid by trying to unlock
      const testIdentity = new WotIdentity()
      await testIdentity.unlock(cleanMnemonic, 'test-passphrase')
      const testDid = testIdentity.getDid()

      setDid(testDid)
      setMnemonic(cleanMnemonic)
      setStep('protect')
    } catch (e) {
      if (e instanceof Error && e.message.includes('Invalid mnemonic')) {
        setError(
          'Ungültige Magische Wörter. Bitte prüfe die Wörter und die Reihenfolge.'
        )
      } else {
        setError('Fehler bei der Validierung')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleProtect = async () => {
    if (passphrase.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    if (passphrase !== passphraseConfirm) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Delete any existing identity
      const identity = new WotIdentity()
      await identity.deleteStoredIdentity()

      // WICHTIG: storeSeed=true - Identity in IndexedDB speichern
      await identity.unlock(mnemonic, passphrase, true)

      const recoveredDid = identity.getDid()

      // Save minimal identity to localStorage — profile will sync from Evolu
      const now = new Date().toISOString()
      localStorage.setItem('wot-identity', JSON.stringify({
        did: recoveredDid,
        profile: { name: '' },
        createdAt: now,
        updatedAt: now,
      }))

      setDid(recoveredDid)
      setStep('complete')

      // Complete recovery
      setTimeout(() => {
        onComplete(identity, recoveredDid)
      }, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Wiederherstellung')
    } finally {
      setIsLoading(false)
    }
  }

  const wordCount = mnemonic.trim().split(/\s+/).filter((w) => w).length
  const isValidWordCount = wordCount === 12

  return (
    <div className="max-w-2xl mx-auto p-6">
      {step !== 'import' && step !== 'complete' && (
        <ProgressIndicator currentStep={getCurrentStepNumber()} totalSteps={3} steps={STEPS} />
      )}

      {/* Step 1: Import */}
      {step === 'import' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Identität importieren
              <InfoTooltip content="Importiere deine bestehenden 12 Magischen Wörter, um deine Identität auf diesem Gerät wiederherzustellen." />
            </h1>
            <p className="text-slate-600">
              Gib deine 12 Magischen Wörter ein, um deine Identität wiederherzustellen
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Magische Wörter
                </label>
                <span
                  className={`text-xs font-medium ${
                    isValidWordCount ? 'text-green-600' : 'text-slate-400'
                  }`}
                >
                  {wordCount}/12 Wörter
                </span>
              </div>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value.toLowerCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidWordCount && !isLoading) {
                    e.preventDefault()
                    handleValidate()
                  }
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={4}
                placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                autoFocus
              />
              <p className="mt-1 text-xs text-slate-500">
                Trenne die Wörter mit Leerzeichen. Nur Kleinbuchstaben.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-medium text-blue-900 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Was passiert als Nächstes:</span>
              </h3>
              <ol className="space-y-1 text-xs text-blue-800 ml-6">
                <li>1. Wir validieren deine Magischen Wörter</li>
                <li>2. Du legst ein neues Passwort für dieses Gerät fest</li>
                <li>3. Deine Identität wird wiederhergestellt</li>
              </ol>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleValidate}
                disabled={isLoading || !isValidWordCount}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Validiere...' : 'Weiter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Protect with Passphrase */}
      {step === 'protect' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Neues Passwort festlegen
              <InfoTooltip content="Lege ein neues Passwort fest, um deine Identität auf diesem Gerät zu schützen." />
            </h1>
            <p className="text-slate-600">
              Wähle ein sicheres Passwort für dieses Gerät
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Neues Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && passphrase && passphraseConfirm && !isLoading) {
                      handleProtect()
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mindestens 8 Zeichen"
                  autoFocus
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Passwort bestätigen
              </label>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphraseConfirm}
                onChange={(e) => setPassphraseConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passphrase && passphraseConfirm && !isLoading) {
                    handleProtect()
                  }
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Passwort wiederholen"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleProtect}
              disabled={isLoading || !passphrase || !passphraseConfirm}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Stelle wieder her...' : 'Identität wiederherstellen'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Wiederherstellung erfolgreich! 🎉</h1>
          <p className="text-slate-600">Deine Identität wurde erfolgreich wiederhergestellt</p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-2">Deine DID:</p>
            <p className="font-mono text-xs text-slate-900 break-all">{did}</p>
          </div>
          <div className="animate-pulse text-slate-500 text-sm">
            Du wirst zur App weitergeleitet...
          </div>
        </div>
      )}
    </div>
  )
}
