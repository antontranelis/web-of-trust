import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ArrowLeft, Loader2, Wifi, WifiOff, ShieldCheck, ShieldX } from 'lucide-react'
import { useVerification } from '../../hooks'
import type { PublicProfile } from '@real-life/wot-core'
import { Avatar } from '../shared/Avatar'
import { ShowCode } from './ShowCode'
import { ScanCode } from './ScanCode'
import { useAdapters } from '../../context'

type Mode = 'select' | 'initiate' | 'confirm' | 'respond' | 'success' | 'error'

export function VerificationFlow() {
  const {
    step,
    challenge,
    error,
    peerName,
    peerDid,
    isConnected,
    pendingIncoming,
    createChallenge,
    prepareResponse,
    confirmAndRespond,
    confirmIncoming,
    rejectIncoming,
    reset,
  } = useVerification()
  const { discovery } = useAdapters()

  const [mode, setMode] = useState<Mode>('select')
  const [challengeCode, setChallengeCode] = useState('')
  const [peerProfile, setPeerProfile] = useState<PublicProfile | null>(null)
  const [incomingProfile, setIncomingProfile] = useState<PublicProfile | null>(null)

  // Fetch peer profile from DiscoveryAdapter when entering confirm mode
  useEffect(() => {
    if (mode !== 'confirm' || !peerDid) return
    let cancelled = false
    discovery.resolveProfile(peerDid)
      .then((profile) => { if (!cancelled && profile) setPeerProfile(profile) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [mode, peerDid, discovery])

  // Fetch incoming peer's profile when pendingIncoming arrives
  useEffect(() => {
    if (!pendingIncoming) { setIncomingProfile(null); return }
    let cancelled = false
    discovery.resolveProfile(pendingIncoming.fromDid)
      .then((profile) => { if (!cancelled && profile) setIncomingProfile(profile) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pendingIncoming, discovery])

  // Auto-transition: step 'done' → success
  useEffect(() => {
    if (step === 'done' && (mode === 'confirm' || mode === 'initiate')) {
      setMode('success')
    }
  }, [step, mode])

  const handleInitiate = async () => {
    try {
      const code = await createChallenge()
      setChallengeCode(code)
      setMode('initiate')
    } catch {
      setMode('error')
    }
  }

  // Bob scans code → decode and show peer info for confirmation
  const handleScanCode = async (code: string) => {
    try {
      await prepareResponse(code)
      setMode('confirm')
    } catch {
      setMode('error')
    }
  }

  // Bob confirms → create verification + send
  const handleConfirm = async () => {
    try {
      await confirmAndRespond()
      setMode('success')
    } catch {
      setMode('error')
    }
  }

  const handleReset = () => {
    reset()
    setMode('select')
    setChallengeCode('')
    setPeerProfile(null)
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

  const handleConfirmIncoming = async () => {
    try {
      await confirmIncoming()
      setMode('success')
    } catch {
      setMode('error')
    }
  }

  const handleRejectIncoming = () => {
    rejectIncoming()
  }

  if (mode === 'initiate') {
    // Someone scanned our QR — show confirmation
    if (pendingIncoming) {
      const incomingDid = pendingIncoming.fromDid
      const incomingName = incomingProfile?.name || incomingDid.slice(-12)

      return (
        <div className="space-y-6">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
            Abbrechen
          </button>

          <div className="text-center space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Stehst du vor dieser Person?
            </h3>

            <div className="flex flex-col items-center gap-3 py-4">
              <Avatar
                name={incomingProfile?.name}
                avatar={incomingProfile?.avatar}
                size="lg"
              />
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {incomingName}
                </p>
                {incomingProfile?.bio && (
                  <p className="text-sm text-slate-500 mt-1">
                    {incomingProfile.bio}
                  </p>
                )}
                <p className="text-xs text-slate-400 font-mono mt-1 max-w-[280px] truncate">
                  {incomingDid}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Bestätige nur, wenn du diese Person persönlich kennst und sie dir gegenüber steht.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRejectIncoming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
              >
                <ShieldX size={18} />
                Ablehnen
              </button>
              <button
                onClick={handleConfirmIncoming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                <ShieldCheck size={18} />
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )
    }

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
          title="Dein Verifizierungs-Code"
          description="Die andere Person scannt diesen Code."
          onRefresh={handleInitiate}
        />

        {/* Relay status */}
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi size={14} className="text-green-500" />
              <span className="text-green-600">Relay verbunden</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-amber-500" />
              <span className="text-amber-600">Relay nicht verbunden</span>
            </>
          )}
        </div>

        {/* Waiting indicator */}
        {step === 'initiating' && (
          <div className="flex items-center justify-center gap-3 py-4 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Warte darauf, dass jemand den Code scannt...</span>
          </div>
        )}
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
          buttonText="Code prüfen"
          onSubmit={handleScanCode}
        />
      </div>
    )
  }

  if (mode === 'confirm') {
    return (
      <div className="space-y-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={18} />
          Abbrechen
        </button>

        <div className="text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            Stehst du vor dieser Person?
          </h3>

          <div className="flex flex-col items-center gap-3 py-4">
            <Avatar
              name={peerProfile?.name || peerName || undefined}
              avatar={peerProfile?.avatar}
              size="lg"
            />
            <div>
              <p className="text-xl font-semibold text-slate-900">
                {peerProfile?.name || peerName || 'Unbekannt'}
              </p>
              {peerProfile?.bio && (
                <p className="text-sm text-slate-500 mt-1">
                  {peerProfile.bio}
                </p>
              )}
              {peerDid && (
                <p className="text-xs text-slate-400 font-mono mt-1 max-w-[280px] truncate">
                  {peerDid}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Bestätige nur, wenn du diese Person persönlich kennst und sie dir gegenüber steht.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
            >
              <ShieldX size={18} />
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={step === 'responding'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {step === 'responding' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShieldCheck size={18} />
              )}
              Bestätigen
            </button>
          </div>
        </div>
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
            {peerName
              ? `${peerName} wurde verifiziert.`
              : challenge?.fromName
              ? `${challenge.fromName} wurde verifiziert.`
              : 'Der Kontakt wurde verifiziert.'}
          </p>

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
