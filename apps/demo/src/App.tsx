import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, useIdentity, useAdapters, PendingVerificationProvider, usePendingVerification } from './context'
import { AppShell, IdentityManagement, Confetti } from './components'
import { Home, Identity, Contacts, Verify, Attestations, PublicProfile } from './pages'
import { useProfileSync, useMessaging, useContacts } from './hooks'
import { VerificationHelper } from '@real-life/wot-core'
import type { VerificationPayload } from './types/verification-messages'

/**
 * Mounts useProfileSync globally so profile-update listeners
 * and initial contact sync run on every page, not just /identity.
 */
function ProfileSyncEffect() {
  useProfileSync()
  return null
}

/**
 * Global listener for incoming verification messages.
 * - response: If Alice leaves /verify and Bob responds, stores pending and navigates back.
 * - complete: Bob receives Alice's completion → triggers global confetti.
 */
function VerificationListenerEffect() {
  const { onMessage } = useMessaging()
  const { challengeNonce, setPending, triggerConfetti } = usePendingVerification()
  const { verificationService } = useAdapters()
  const { activeContacts } = useContacts()
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onMessage(async (envelope) => {
      if (envelope.type !== 'verification') return

      let payload: VerificationPayload
      try {
        payload = JSON.parse(envelope.payload)
      } catch {
        return
      }

      // Alice receives Bob's response → store pending and navigate to /verify
      if (payload.action === 'response' && challengeNonce) {
        const decoded = JSON.parse(atob(payload.responseCode))
        if (decoded.nonce !== challengeNonce) return

        const alreadyContact = activeContacts.some(c => c.did === decoded.toDid)
        if (alreadyContact) return

        setPending({ responseCode: payload.responseCode, decoded })
        navigate('/verify')
      }

      // Bob receives Alice's verification-complete → save + confetti + toast
      if (payload.action === 'complete') {
        try {
          const verification = payload.verification
          const isValid = await VerificationHelper.verifySignature(verification)
          if (!isValid) return

          await verificationService.saveVerification(verification)
          const peerContact = activeContacts.find(c => c.did === envelope.fromDid)
          const peerName = peerContact?.name || 'Kontakt'
          triggerConfetti(`${peerName} und du habt euch gegenseitig verifiziert!`)
        } catch {
          // Ignore invalid complete messages
        }
      }
    })
    return unsubscribe
  }, [onMessage, challengeNonce, setPending, navigate, activeContacts, triggerConfetti, verificationService])

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
  const { identity } = useIdentity()

  // Not logged in: only /p/:did is accessible
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

  // Logged in: all routes including /p/:did inside AppShell
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
