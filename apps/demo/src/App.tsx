import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, SecureIdentityProvider, useSecureIdentity } from './context'
import { AppShell, IdentityManagement } from './components'
import { Home, Identity, Contacts, Verify, Attestations } from './pages'

function RequireIdentity({ children }: { children: React.ReactNode }) {
  const { identity, did, setIdentity } = useSecureIdentity()

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

  return <>{children}</>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </RequireIdentity>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AdapterProvider>
        <IdentityProvider>
          <SecureIdentityProvider>
            <AppRoutes />
          </SecureIdentityProvider>
        </IdentityProvider>
      </AdapterProvider>
    </BrowserRouter>
  )
}
