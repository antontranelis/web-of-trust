import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, useIdentity, useAdapters, PendingVerificationProvider, usePendingVerification } from './context'
import { useConfetti } from './context/PendingVerificationContext'
import { AppShell, IdentityManagement, Confetti } from './components'
import { Home, Identity, Contacts, Verify, Attestations, PublicProfile } from './pages'
import { useProfileSync, useMessaging, useContacts } from './hooks'
import { useVerificationStatus, getVerificationStatus } from './hooks/useVerificationStatus'
import { VerificationHelper } from '@real-life/wot-core'
import type { Verification, MessageEnvelope } from '@real-life/wot-core'

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
  const { onMessage, send } = useMessaging()
  const { verificationService } = useAdapters()
  const { identity, did } = useIdentity()
  const { contacts } = useContacts()
  const { allVerifications } = useVerificationStatus()
  const { challengeNonce, setChallengeNonce, setPendingIncoming } = useConfetti()

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

      // Counter-verification: if I'm the recipient and I haven't
      // verified the sender yet.
      //
      // Two paths:
      // 1. Known contact → auto counter-verify (trusted)
      // 2. Unknown sender with valid nonce → show confirmation UI
      //    (nonce proves QR scan, but user must confirm in-person)
      if (did && identity && verification.to === did) {
        const alreadyVerified = allVerifications.some(
          v => v.from === did && v.to === verification.from
        )

        if (!alreadyVerified) {
          const isContact = contacts.some(c => c.did === verification.from)

          if (isContact) {
            // Known contact: auto counter-verify
            try {
              const nonce = crypto.randomUUID()
              const counter = await VerificationHelper.createVerificationFor(identity, verification.from, nonce)
              await verificationService.saveVerification(counter)

              const counterEnvelope: MessageEnvelope = {
                v: 1,
                id: counter.id,
                type: 'verification',
                fromDid: did,
                toDid: verification.from,
                createdAt: new Date().toISOString(),
                encoding: 'json',
                payload: JSON.stringify(counter),
                signature: counter.proof.proofValue,
              }
              await send(counterEnvelope)
            } catch {
              // Counter-verification failed — non-critical
            }
          } else {
            // Unknown sender: only accept if nonce proves QR scan
            if (challengeNonce && verification.id.includes(challengeNonce)) {
              setChallengeNonce(null) // Nonce consumed
              setPendingIncoming({ verification, fromDid: verification.from })
            }
            // else: spam — ignore
          }
        }
      }
    })
    return unsubscribe
  }, [onMessage, verificationService, did, identity, contacts, allVerifications, send, challengeNonce, setChallengeNonce, setPendingIncoming])

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

  useEffect(() => {
    if (!did) return

    const prev = previousStatusRef.current
    for (const contact of activeContacts) {
      const status = getVerificationStatus(did, contact.did, allVerifications)
      const prevStatus = prev.get(contact.did) || 'none'

      if (status === 'mutual' && prevStatus !== 'mutual') {
        const name = contact.name || 'Kontakt'
        triggerConfetti(`${name} und du habt euch gegenseitig verifiziert!`)
      }

      prev.set(contact.did, status)
    }
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
