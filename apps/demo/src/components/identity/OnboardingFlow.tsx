import { useState } from 'react'
import { Key, Copy, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { SecureWotIdentity } from '@real-life/wot-core'

type OnboardingStep = 'passphrase' | 'mnemonic' | 'verify' | 'complete'

interface OnboardingFlowProps {
  onComplete: (identity: SecureWotIdentity, did: string) => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('passphrase')
  const [passphrase, setPassphrase] = useState('')
  const [passphraseConfirm, setPassphraseConfirm] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [did, setDid] = useState('')
  const [copied, setCopied] = useState(false)
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([])
  const [verifyInput, setVerifyInput] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateIdentity = async () => {
    if (passphrase.length < 8) {
      setError('Passphrase muss mindestens 8 Zeichen lang sein')
      return
    }
    if (passphrase !== passphraseConfirm) {
      setError('Passphrases stimmen nicht überein')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const identity = new SecureWotIdentity()
      const result = await identity.create(passphrase)

      setMnemonic(result.mnemonic)
      setDid(result.did)

      // Generate 3 random words for verification
      const words = result.mnemonic.split(' ')
      const indices: number[] = []
      while (indices.length < 3) {
        const idx = Math.floor(Math.random() * 12)
        if (!indices.includes(idx)) {
          indices.push(idx)
        }
      }
      setVerifyWords(
        indices.sort((a, b) => a - b).map((i) => ({ index: i, word: words[i] }))
      )

      setStep('mnemonic')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen der Identität')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMnemonic = async () => {
    await navigator.clipboard.writeText(mnemonic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = () => {
    const words = mnemonic.split(' ')
    const correct = verifyWords.every((v) => {
      const input = verifyInput[v.index]?.trim().toLowerCase()
      return input === v.word.toLowerCase()
    })

    if (!correct) {
      setError('Die eingegebenen Wörter stimmen nicht überein. Bitte prüfe deine Recovery Phrase.')
      return
    }

    setError(null)
    setStep('complete')

    // Complete onboarding
    const identity = new SecureWotIdentity()
    identity.unlock(mnemonic, passphrase).then(() => {
      onComplete(identity, did)
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Passphrase Step */}
      {step === 'passphrase' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Erstelle deine Identität
            </h1>
            <p className="text-slate-600">
              Wähle eine sichere Passphrase. Diese benötigst du um deine Identität zu entsperren.
            </p>
          </div>

          <div className="space-y-4">
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
                Passphrase bestätigen
              </label>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphraseConfirm}
                onChange={(e) => setPassphraseConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Passphrase wiederholen"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateIdentity}
              disabled={isLoading || !passphrase || !passphraseConfirm}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Erstelle Identität...' : 'Weiter'}
            </button>
          </div>
        </div>
      )}

      {/* Mnemonic Display Step */}
      {step === 'mnemonic' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Schreibe diese 12 Wörter auf!
            </h1>
            <p className="text-slate-600">
              Dies ist deine <strong>Recovery Phrase</strong>. Mit diesen 12 Wörtern kannst du deine Identität wiederherstellen, falls du dein Gerät verlierst.
            </p>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-3">
              {mnemonic.split(' ').map((word, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-slate-500 text-sm w-6">{i + 1}.</span>
                  <span className="font-mono font-medium text-slate-900">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCopyMnemonic}
              className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span>Kopieren</span>
                </>
              )}
            </button>
            <button
              onClick={() => setStep('verify')}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ich habe es aufgeschrieben
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <strong>⚠️ Wichtig:</strong> Diese Wörter werden nie wieder angezeigt. Bewahre sie sicher auf!
          </div>
        </div>
      )}

      {/* Verification Step */}
      {step === 'verify' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Verifizierung
            </h1>
            <p className="text-slate-600">
              Gib die folgenden Wörter ein, um zu bestätigen, dass du sie aufgeschrieben hast:
            </p>
          </div>

          <div className="space-y-4">
            {verifyWords.map((v) => (
              <div key={v.index}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Wort #{v.index + 1}
                </label>
                <input
                  type="text"
                  value={verifyInput[v.index] || ''}
                  onChange={(e) =>
                    setVerifyInput({ ...verifyInput, [v.index]: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Wort eingeben..."
                  autoComplete="off"
                />
              </div>
            ))}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={verifyWords.some((v) => !verifyInput[v.index]?.trim())}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Verifizieren
            </button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Identität erstellt! 🎉
          </h1>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-2">Deine DID:</p>
            <p className="font-mono text-xs text-slate-900 break-all">{did}</p>
          </div>
          <p className="text-slate-600">
            Du wirst jetzt zur App weitergeleitet...
          </p>
        </div>
      )}
    </div>
  )
}
