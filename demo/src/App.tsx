import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider, IdentityProvider, useIdentity } from './context'
import { AppShell, CreateIdentity } from './components'
import { Home, Identity, Contacts, Verify, Attestations } from './pages'

function RequireIdentity({ children }: { children: React.ReactNode }) {
  const { hasIdentity, isLoading } = useIdentity()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Lade...</div>
      </div>
    )
  }

  if (!hasIdentity) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <CreateIdentity />
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
          <AppRoutes />
        </IdentityProvider>
      </AdapterProvider>
    </BrowserRouter>
  )
}
