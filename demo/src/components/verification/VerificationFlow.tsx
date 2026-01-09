import { useState } from 'react'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useVerification } from '../../hooks'
import { ShowCode } from './ShowCode'
import { ScanCode } from './ScanCode'

type Mode = 'select' | 'initiate' | 'respond' | 'complete' | 'success' | 'error'

export function VerificationFlow() {
  const {
    step,
    challenge,
    response,
    error,
    createChallenge,
    respondToChallenge,
    completeVerification,
    reset,
  } = useVerification()

  const [mode, setMode] = useState<Mode>('select')
  const [challengeCode, setChallengeCode] = useState('')
  const [responseCode, setResponseCode] = useState('')

  const handleInitiate = async () => {
    try {
      const code = await createChallenge()
      setChallengeCode(code)
      setMode('initiate')
    } catch (e) {
      setMode('error')
    }
  }

  const handleRespond = async (code: string) => {
    try {
      const respCode = await respondToChallenge(code)
      setResponseCode(respCode)
      setMode('success')
    } catch (e) {
      setMode('error')
    }
  }

  const handleComplete = async (code: string) => {
    try {
      await completeVerification(code)
      setMode('success')
    } catch (e) {
      setMode('error')
    }
  }

  const handleReset = () => {
    reset()
    setMode('select')
    setChallengeCode('')
    setResponseCode('')
  }

  if (mode === 'select') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Kontakt verifizieren</h2>
          <p className="text-slate-600">
            Verifiziere einen Kontakt durch persönliches Treffen.
          </p>
        </div>

        <button
          onClick={handleInitiate}
          className="w-full p-4 border-2 border-primary-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
        >
          <h3 className="font-medium text-slate-900 mb-1">Verifizierung starten</h3>
          <p className="text-sm text-slate-600">
            Zeige deinen Code der anderen Person
          </p>
        </button>

        <button
          onClick={() => setMode('respond')}
          className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
        >
          <h3 className="font-medium text-slate-900 mb-1">Code eingeben</h3>
          <p className="text-sm text-slate-600">
            Gib den Code ein, den dir jemand zeigt
          </p>
        </button>
      </div>
    )
  }

  if (mode === 'initiate') {
    return (
      <div className="space-y-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={18} />
          Zurück
        </button>

        <ShowCode
          code={challengeCode}
          title="Schritt 1: Zeige diesen Code"
          description="Die andere Person muss diesen Code eingeben."
          onRefresh={handleInitiate}
        />

        <div className="border-t border-slate-200 pt-6">
          <ScanCode
            title="Schritt 2: Antwort-Code eingeben"
            description="Gib den Code ein, den du von der anderen Person erhältst."
            placeholder="Antwort-Code hier einfügen..."
            buttonText="Verifizierung abschließen"
            onSubmit={handleComplete}
            isLoading={step === 'completing'}
          />
        </div>
      </div>
    )
  }

  if (mode === 'respond') {
    return (
      <div className="space-y-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={18} />
          Zurück
        </button>

        <ScanCode
          title="Code eingeben"
          description="Gib den Code ein, den dir die andere Person zeigt."
          placeholder="Code hier einfügen..."
          buttonText="Code bestätigen"
          onSubmit={handleRespond}
          isLoading={step === 'responding'}
        />
      </div>
    )
  }

  if (mode === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Verifizierung erfolgreich!</h3>
        <p className="text-slate-600 mb-6">
          {response
            ? `${response.responderProfile?.name || 'Kontakt'} wurde verifiziert.`
            : challenge
            ? `${challenge.initiatorProfile?.name || 'Kontakt'} wurde verifiziert.`
            : 'Der Kontakt wurde verifiziert.'}
        </p>

        {responseCode && (
          <div className="mb-6">
            <ShowCode
              code={responseCode}
              title="Antwort-Code"
              description="Zeige diesen Code der anderen Person, damit sie die Verifizierung abschließen kann."
            />
          </div>
        )}

        <button
          onClick={handleReset}
          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Weitere Verifizierung
        </button>
      </div>
    )
  }

  if (mode === 'error') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Fehler</h3>
        <p className="text-slate-600 mb-6">
          {error?.message || 'Die Verifizierung ist fehlgeschlagen.'}
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return null
}
