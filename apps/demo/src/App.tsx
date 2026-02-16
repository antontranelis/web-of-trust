import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, useIdentity, useAdapters, PendingVerificationProvider, usePendingVerification } from './context'
import { useConfetti } from './context/PendingVerificationContext'
import { AppShell, IdentityManagement, Confetti } from './components'
import { Avatar } from './components/shared/Avatar'
import { X, Award } from 'lucide-react'
import { Home, Identity, Contacts, Verify, Attestations, PublicProfile } from './pages'
import { useProfileSync, useMessaging, useContacts, useVerification, useLocalIdentity } from './hooks'
import { useVerificationStatus, getVerificationStatus } from './hooks/useVerificationStatus'
import { VerificationHelper } from '@real-life/wot-core'
import type { Verification, PublicProfile as PublicProfileType } from '@real-life/wot-core'

/**
 * Mounts useProfileSync globally so profile-update listeners
 * and initial contact sync run on every page, not just /identity.
 */
function ProfileSyncEffect() {
  useProfileSync()
  return null
}

/**
 * Global listener for verification relay messages.
 *
 * receive → verify signature → save → auto counter-verification if needed.
 *
 * Counter-verification: when I receive a verification from a contact
 * and I haven't verified them yet, automatically create + send one back.
 * This makes the flow symmetric: B scans A's QR → both get verified.
 */
function VerificationListenerEffect() {
  const { onMessage } = useMessaging()
  const { verificationService } = useAdapters()
  const { did } = useIdentity()
  const { challengeNonce, setChallengeNonce, setPendingIncoming } = useConfetti()

  // Use ref so the onMessage callback always sees current nonce
  // without needing to re-subscribe (which can lose messages).
  const challengeNonceRef = useRef(challengeNonce)
  challengeNonceRef.current = challengeNonce

  useEffect(() => {
    const unsubscribe = onMessage(async (envelope) => {
      if (envelope.type !== 'verification') return

      let verification: Verification
      try {
        verification = JSON.parse(envelope.payload)
      } catch {
        return
      }

      if (!verification.id || !verification.from || !verification.to || !verification.proof) return

      try {
        const isValid = await VerificationHelper.verifySignature(verification)
        if (!isValid) return

        await verificationService.saveVerification(verification)
      } catch {
        return
      }

      // Counter-verification: if I'm the recipient and the verification
      // contains my active challenge nonce (proves physical QR scan)
      // → show confirmation UI. Re-verification is allowed (renewal).
      if (did && verification.to === did) {
        const nonce = challengeNonceRef.current

        if (nonce && verification.id.includes(nonce)) {
          setChallengeNonce(null) // Nonce consumed
          setPendingIncoming({ verification, fromDid: verification.from })
        }
      }
    })
    return unsubscribe
  }, [onMessage, verificationService, did, setChallengeNonce, setPendingIncoming])

  return null
}

/**
 * Reactive mutual verification detection.
 *
 * Watches all verifications and triggers confetti when a contact's
 * status transitions to "mutual". No session state needed.
 */
function MutualVerificationEffect() {
  const { triggerMutualDialog } = usePendingVerification()
  const { did } = useIdentity()
  const { activeContacts } = useContacts()
  const { allVerifications } = useVerificationStatus()
  const previousStatusRef = useRef(new Map<string, string>())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!did) return

    const prev = previousStatusRef.current
    for (const contact of activeContacts) {
      const status = getVerificationStatus(did, contact.did, allVerifications)
      const prevStatus = prev.get(contact.did)

      // Only trigger dialog for transitions to 'mutual' after initial load.
      // On first render, just record current state without triggering.
      // For contacts added after init, default to 'none' so transitions are detected.
      const effectivePrev = prevStatus ?? (initializedRef.current ? 'none' : undefined)
      if (initializedRef.current && effectivePrev !== undefined && status === 'mutual' && effectivePrev !== 'mutual') {
        triggerMutualDialog({ name: contact.name || 'Kontakt', did: contact.did })
      }

      prev.set(contact.did, status)
    }
    initializedRef.current = true
  }, [did, activeContacts, allVerifications, triggerMutualDialog])

  return null
}

/**
 * Dialog shown when mutual verification is detected.
 * Extracted so hooks are only called when mutualPeer exists.
 */
function MutualVerificationDialog() {
  const { mutualPeer, dismissMutualDialog } = usePendingVerification()
  const { discovery } = useAdapters()
  const localIdentity = useLocalIdentity()
  const navigate = useNavigate()
  const [peerProfile, setPeerProfile] = useState<PublicProfileType | null>(null)

  useEffect(() => {
    if (!mutualPeer) { setPeerProfile(null); return }
    let cancelled = false
    discovery.resolveProfile(mutualPeer.did)
      .then((p) => { if (!cancelled && p) setPeerProfile(p) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [mutualPeer, discovery])

  if (!mutualPeer) return null

  const peerName = peerProfile?.name || mutualPeer.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-toast-in relative">
        <button
          onClick={dismissMutualDialog}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center -space-x-3">
            <Avatar
              name={localIdentity?.profile?.name}
              avatar={localIdentity?.profile?.avatar}
              size="lg"
            />
            <Avatar
              name={peerProfile?.name || mutualPeer.name}
              avatar={peerProfile?.avatar}
              size="lg"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-900 text-center">
            Du und {peerName} sind Freunde!
          </h3>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              dismissMutualDialog()
              navigate(`/attestations/new?to=${encodeURIComponent(mutualPeer.did)}`)
            }}
            className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Attestierung erstellen
          </button>
          <button
            onClick={() => {
              dismissMutualDialog()
              navigate(`/p/${encodeURIComponent(mutualPeer.did)}`)
            }}
            className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Profil ansehen
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Dialog shown when an incoming attestation is received.
 */
function IncomingAttestationDialog() {
  const { incomingAttestation, dismissAttestationDialog } = usePendingVerification()
  const { attestationService } = useAdapters()

  if (!incomingAttestation) return null

  const handlePublish = async () => {
    await attestationService.setAttestationAccepted(incomingAttestation.attestationId, true)
    dismissAttestationDialog()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-toast-in relative">
        <button
          onClick={dismissAttestationDialog}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 text-center">
            Neue Attestierung erhalten
          </h3>
          <p className="text-sm text-slate-600 text-center">
            <span className="font-medium text-slate-900">{incomingAttestation.senderName}</span> attestiert: &ldquo;{incomingAttestation.claim}&rdquo;
          </p>
        </div>

        <button
          onClick={handlePublish}
          className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          Veröffentlichen
        </button>
      </div>
    </div>
  )
}

/**
 * Renders global confetti + mutual verification dialog.
 */
function GlobalConfetti() {
  const { confettiKey } = usePendingVerification()

  if (confettiKey === 0) return null

  return (
    <>
      <Confetti key={confettiKey} />
      <MutualVerificationDialog />
    </>
  )
}

/**
 * Global overlay dialog for incoming verification requests.
 * Shows "Stehst du vor dieser Person?" regardless of current page.
 */
function IncomingVerificationDialog() {
  const { pendingIncoming } = useConfetti()
  const { confirmIncoming, rejectIncoming } = useVerification()
  const { discovery } = useAdapters()
  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!pendingIncoming) { setProfile(null); return }
    let cancelled = false
    discovery.resolveProfile(pendingIncoming.fromDid)
      .then((p) => { if (!cancelled && p) setProfile(p) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pendingIncoming, discovery])

  if (!pendingIncoming) return null

  const incomingDid = pendingIncoming.fromDid
  const name = profile?.name || incomingDid.slice(-12)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmIncoming()
    } catch (e) {
      console.error('Counter-verification failed:', e)
    }
    setConfirming(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 text-center">
          Stehst du vor dieser Person?
        </h3>

        <div className="flex flex-col items-center gap-3 py-2">
          <Avatar name={profile?.name} avatar={profile?.avatar} size="lg" />
          <div className="text-center">
            <p className="text-xl font-semibold text-slate-900">{name}</p>
            {profile?.bio && (
              <p className="text-sm text-slate-500 mt-1">{profile.bio}</p>
            )}
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-[280px] truncate">
              {incomingDid}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 text-center">
          Bestätige nur, wenn du diese Person persönlich kennst und sie dir gegenüber steht.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={rejectIncoming}
            className="flex-1 px-4 py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
          >
            Ablehnen
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {confirming ? 'Sende...' : 'Bestätigen'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * RequireIdentity gate - shows onboarding if no unlocked identity.
 * Once identity is unlocked, it renders AdapterProvider (which inits Evolu)
 * and then the rest of the app.
 */
function RequireIdentity({ children }: { children: React.ReactNode }) {
  const { identity, did, hasStoredIdentity, setIdentity } = useIdentity()

  // Still checking if identity exists in storage
  if (hasStoredIdentity === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Lade...</p>
        </div>
      </div>
    )
  }

  // Identity not unlocked yet (but might be stored)
  if (!identity || !did) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <IdentityManagement
          onComplete={(newIdentity, newDid, initialProfile) => {
            setIdentity(newIdentity, newDid, initialProfile)
          }}
        />
      </div>
    )
  }

  // Identity is unlocked -> initialize Evolu with identity-derived keys
  return (
    <AdapterProvider identity={identity}>
      <PendingVerificationProvider>
        <ProfileSyncEffect />
        <VerificationListenerEffect />
        <MutualVerificationEffect />
        <GlobalConfetti />
        <IncomingVerificationDialog />
        <IncomingAttestationDialog />
        {children}
      </PendingVerificationProvider>
    </AdapterProvider>
  )
}

/**
 * Standalone wrapper for /p/:did when not logged in.
 */
function PublicProfileStandalone() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PublicProfile />
      </div>
    </div>
  )
}

/**
 * Top-level router: /p/:did is public (no login required).
 * All other routes go through RequireIdentity.
 * When logged in, /p/:did renders inside AppShell with navigation.
 */
function AppRoutes() {
  const { identity, hasStoredIdentity } = useIdentity()

  // Still initializing or auto-unlocking — don't flash the standalone layout.
  // hasStoredIdentity === null means check hasn't finished yet.
  // hasStoredIdentity === true && !identity means auto-unlock failed, passphrase needed.
  // In both cases, go through RequireIdentity (which shows loading or passphrase prompt).
  if (!identity && hasStoredIdentity !== false) {
    return (
      <RequireIdentity>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/attestations/*" element={<Attestations />} />
            <Route path="/p/:did" element={<PublicProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </RequireIdentity>
    )
  }

  // Definitely not logged in (no stored identity): /p/:did is standalone, rest goes to onboarding
  if (!identity) {
    return (
      <Routes>
        <Route path="/p/:did" element={<PublicProfileStandalone />} />
        <Route path="*" element={
          <RequireIdentity>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </RequireIdentity>
        } />
      </Routes>
    )
  }

  // Logged in: all routes inside AppShell
  return (
    <RequireIdentity>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/attestations/*" element={<Attestations />} />
          <Route path="/p/:did" element={<PublicProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </RequireIdentity>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <IdentityProvider>
        <AppRoutes />
      </IdentityProvider>
    </BrowserRouter>
  )
}
