import { useState } from 'react'
import { Key, Copy, Check, AlertTriangle, Shield, Eye, EyeOff, Sparkles } from 'lucide-react'
import { WotIdentity, type Profile } from '@real-life/wot-core'
import { ProgressIndicator, SecurityChecklist, InfoTooltip, AvatarUpload } from '../shared'

type OnboardingStep = 'generate' | 'display' | 'verify' | 'profile' | 'protect' | 'complete'

interface OnboardingFlowProps {
  onComplete: (identity: WotIdentity, did: string, initialProfile?: Profile) => void
}

const STEPS = [
  { label: 'Generieren', description: 'Seed erstellen' },
  { label: 'Sichern', description: 'Magische Wörter speichern' },
  { label: 'Prüfen', description: 'Wörter verifizieren' },
  { label: 'Profil', description: 'Dein Name' },
  { label: 'Schützen', description: 'Passwort festlegen' },
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('generate')
  const [mnemonic, setMnemonic] = useState('')
  const [did, setDid] = useState('')
  const [copied, setCopied] = useState(false)
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([])
  const [verifyInput, setVerifyInput] = useState<Record<number, string>>({})
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const [passphrase, setPassphrase] = useState('')
  const [passphraseConfirm, setPassphraseConfirm] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [checklistItems, setChecklistItems] = useState([
    { id: 'written', label: 'Ich habe alle 12 Magischen Wörter aufgeschrieben', checked: false },
    { id: 'safe', label: 'Ich habe sie an einem sicheren Ort verwahrt', checked: false },
    { id: 'understand', label: 'Ich verstehe, dass sie nicht wiederhergestellt werden können', checked: false },
  ])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getCurrentStepNumber = () => {
    const stepMap: Record<OnboardingStep, number> = {
      generate: 1,
      display: 2,
      verify: 3,
      profile: 4,
      protect: 5,
      complete: 5,
    }
    return stepMap[step]
  }

  const handleGenerate = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const identity = new WotIdentity()
      // WICHTIG: storeSeed=false - erst speichern wenn User Passwort gesetzt hat
      const result = await identity.create('', false)

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
      setVerifyWords(indices.sort((a, b) => a - b).map((i) => ({ index: i, word: words[i] })))

      setStep('display')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Generieren')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMnemonic = async () => {
    await navigator.clipboard.writeText(mnemonic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleChecklistItem = (id: string) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )
  }

  const handleVerify = () => {
    const words = mnemonic.split(' ')
    const correct = verifyWords.every((v) => {
      const input = verifyInput[v.index]?.trim().toLowerCase()
      return input === v.word.toLowerCase()
    })

    if (!correct) {
      setError('Die eingegebenen Wörter stimmen nicht überein. Bitte prüfe deine Magischen Wörter.')
      return
    }

    setError(null)
    setStep('profile')
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

      const identity = new WotIdentity()
      await identity.unlock(mnemonic, passphrase, true)

      setStep('complete')

      // Complete onboarding — pass profile data for Evolu storage
      const profile: Profile = {
        name: displayName.trim(),
        ...(bio.trim() ? { bio: bio.trim() } : {}),
        ...(avatar ? { avatar } : {}),
      }
      setTimeout(() => {
        onComplete(identity, did, profile)
      }, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Schützen der Identität')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {step !== 'generate' && step !== 'complete' && (
        <ProgressIndicator currentStep={getCurrentStepNumber()} totalSteps={5} steps={STEPS} />
      )}

      {/* Step 1: Generate */}
      {step === 'generate' && (
        <div
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              handleGenerate()
            }
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Willkommen!</h1>
            <p className="text-slate-600 text-lg">
              Erstelle deine dezentrale Identität in wenigen Schritten
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-blue-900 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Was wird passieren:</span>
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 ml-7">
              <li>1. Wir generieren 12 einzigartige Magische Wörter für dich</li>
              <li>2. Du schreibst diese Wörter sicher auf (sehr wichtig!)</li>
              <li>3. Du bestätigst, dass du sie gesichert hast</li>
              <li>4. Du wählst ein Passwort zum Schutz deiner Identität</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Wichtiger Hinweis:</strong> Deine Magischen Wörter sind der einzige Weg,
                deine Identität wiederherzustellen. Bewahre sie sicher auf und teile sie niemals
                mit anderen!
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            autoFocus
          >
            {isLoading ? 'Generiere...' : 'Identität generieren'}
          </button>
        </div>
      )}

      {/* Step 2: Display Mnemonic */}
      {step === 'display' && (
        <div
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && checklistItems.every((item) => item.checked)) {
              setStep('verify')
            }
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Deine Magischen Wörter
              <InfoTooltip content="Diese 12 Wörter sind der Schlüssel zu deiner Identität. Mit ihnen kannst du auf jedem Gerät deine Identität wiederherstellen." />
            </h1>
            <p className="text-slate-600">
              Schreibe diese 12 Wörter in der <strong>richtigen Reihenfolge</strong> auf
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

          <button
            onClick={handleCopyMnemonic}
            className="w-full py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2"
          >
            {copied ? (
              <>
                <Check size={20} />
                <span>Kopiert!</span>
              </>
            ) : (
              <>
                <Copy size={20} />
                <span>In Zwischenablage kopieren</span>
              </>
            )}
          </button>

          <SecurityChecklist items={checklistItems} onToggle={toggleChecklistItem} />

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <strong>⚠️ Letzte Warnung:</strong> Diese Wörter werden nach diesem Schritt nicht mehr
            angezeigt. Stelle sicher, dass du sie sicher aufbewahrt hast!
          </div>

          <button
            onClick={() => setStep('verify')}
            disabled={!checklistItems.every((item) => item.checked)}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Weiter zur Verifizierung
          </button>
        </div>
      )}

      {/* Step 3: Verify */}
      {step === 'verify' && (
        <div
          className="space-y-6"
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !verifyWords.some((v) => !verifyInput[v.index]?.trim())
            ) {
              handleVerify()
            }
          }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Verifizierung</h1>
            <p className="text-slate-600">
              Gib die folgenden Wörter ein, um zu bestätigen, dass du sie korrekt aufgeschrieben
              hast
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // Find next input or submit if last
                      const currentIdx = verifyWords.findIndex((w) => w.index === v.index)
                      if (currentIdx < verifyWords.length - 1) {
                        const nextInput = document.querySelector(
                          `input[value="${verifyInput[verifyWords[currentIdx + 1].index] || ''}"]`
                        ) as HTMLInputElement
                        nextInput?.focus()
                      } else if (!verifyWords.some((vw) => !verifyInput[vw.index]?.trim())) {
                        handleVerify()
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Wort eingeben..."
                  autoComplete="off"
                  autoFocus={v.index === verifyWords[0].index}
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

            <button
              onClick={() => setStep('display')}
              className="w-full py-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              ← Zurück zu den Magischen Wörtern
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Profile */}
      {step === 'profile' && (
        <div
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              setStep('protect')
            }
          }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dein Profil</h1>
            <p className="text-slate-600">
              Wie möchtest du dich anderen gegenüber zeigen?
            </p>
          </div>

          <AvatarUpload name={displayName} avatar={avatar} onAvatarChange={setAvatar} />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dein Name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Über mich</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
                placeholder="Ein kurzer Satz über dich (optional)"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('protect')}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Weiter
          </button>

          <button
            onClick={() => setStep('protect')}
            className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            Überspringen
          </button>
        </div>
      )}

      {/* Step 5: Protect with Passphrase */}
      {step === 'protect' && (
        <div
          className="space-y-6"
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !isLoading &&
              passphrase &&
              passphraseConfirm &&
              passphrase === passphraseConfirm &&
              passphrase.length >= 8
            ) {
              handleProtect()
            }
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Schütze deine Identität
              <InfoTooltip content="Das Passwort verschlüsselt deine Identität auf diesem Gerät. Du benötigst es jedes Mal, wenn du dich anmeldest." />
            </h1>
            <p className="text-slate-600">
              Wähle ein starkes Passwort, um deine Identität auf diesem Gerät zu schützen
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Tipp:</strong> Das Passwort ist <em>nicht</em> deine Magischen Wörter. Es
            schützt deine Identität lokal auf diesem Gerät. Wähle etwas, das du dir merken kannst!
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
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
                Passwort bestätigen
              </label>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphraseConfirm}
                onChange={(e) => setPassphraseConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Passwort wiederholen"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleProtect}
              disabled={isLoading || !passphrase || !passphraseConfirm}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Schütze Identität...' : 'Identität schützen'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 'complete' && (
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Geschafft! 🎉</h1>
          <p className="text-slate-600">Deine Identität wurde erfolgreich erstellt und geschützt</p>
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
