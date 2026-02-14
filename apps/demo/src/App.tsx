import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, useIdentity, useAdapters, PendingVerificationProvider, usePendingVerification } from './context'
import { useConfetti } from './context/PendingVerificationContext'
import { AppShell, IdentityManagement, Confetti } from './components'
import { Avatar } from './components/shared/Avatar'
import { Home, Identity, Contacts, Verify, Attestations, PublicProfile } from './pages'
import { useProfileSync, useMessaging, useContacts, useVerification } from './hooks'
import { useVerificationStatus, getVerificationStatus } from './hooks/useVerificationStatus'
import { VerificationHelper } from '@real-life/wot-core'
import type { Verification, PublicProfile as PublicProfileType, MessageEnvelope } from '@real-life/wot-core'

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
  const { allVerifications } = useVerificationStatus()
  const { challengeNonce, setChallengeNonce, setPendingIncoming } = useConfetti()

  // Use refs so the onMessage callback always sees current values
  // without needing to re-subscribe (which can lose messages).
  const challengeNonceRef = useRef(challengeNonce)
  challengeNonceRef.current = challengeNonce
  const allVerificationsRef = useRef(allVerifications)
  allVerificationsRef.current = allVerifications

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

      // Counter-verification: if I'm the recipient, I haven't verified
      // the sender yet, and the verification contains my active challenge
      // nonce (proves physical QR scan) → show confirmation UI.
      if (did && verification.to === did) {
        const nonce = challengeNonceRef.current
        const verifications = allVerificationsRef.current
        const alreadyVerified = verifications.some(
          v => v.from === did && v.to === verification.from
        )

        if (!alreadyVerified && nonce && verification.id.includes(nonce)) {
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
  const { triggerConfetti } = usePendingVerification()
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

      // Only trigger confetti for transitions to 'mutual' after initial load.
      // On first render, just record current state without triggering.
      if (initializedRef.current && prevStatus !== undefined && status === 'mutual' && prevStatus !== 'mutual') {
        const name = contact.name || 'Kontakt'
        triggerConfetti(`${name} und du habt euch gegenseitig verifiziert!`)
      }

      prev.set(contact.did, status)
    }
    initializedRef.current = true
  }, [did, activeContacts, allVerifications, triggerConfetti])

  return null
}

/**
 * Renders global confetti + toast overlay when triggerConfetti() is called.
 */
function GlobalConfetti() {
  const { confettiKey, toastMessage } = usePendingVerification()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (confettiKey === 0) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [confettiKey])

  if (confettiKey === 0) return null

  return (
    <>
      <Confetti key={confettiKey} />
      {toastMessage && visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm max-w-sm text-center">
            {toastMessage}
          </div>
        </div>
      )}
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
