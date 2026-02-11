import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, useIdentity } from './context'
import { AppShell, IdentityManagement } from './components'
import { Home, Identity, Contacts, Verify, Attestations, PublicProfile } from './pages'
import { useProfileSync } from './hooks'

/**
 * Mounts useProfileSync globally so profile-update listeners
 * and initial contact sync run on every page, not just /identity.
 */
function ProfileSyncEffect() {
  useProfileSync()
  return null
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
          onComplete={(newIdentity, newDid) => {
            setIdentity(newIdentity, newDid)
          }}
        />
      </div>
    )
  }

  // Identity is unlocked -> initialize Evolu with identity-derived keys
  return (
    <AdapterProvider identity={identity}>
      <ProfileSyncEffect />
      {children}
    </AdapterProvider>
  )
}

function AppRoutes() {
  return (
    <RequireIdentity>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/attestations/*" element={<Attestations />} />
          <Route path="/profile/:did" element={<PublicProfile />} />
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
