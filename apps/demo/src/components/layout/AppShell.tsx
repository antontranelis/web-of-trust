import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { Navigation } from './Navigation'
import { useLanguage } from '../../i18n'

const FULLSCREEN_ROUTES = ['/network']

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const fullscreen = FULLSCREEN_ROUTES.some(r => pathname.startsWith(r))

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0">
      {fullscreen ? (
        <main className="flex-1 overflow-hidden md:order-2 relative">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 overflow-auto md:order-2 relative">
          <div className="max-w-2xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      )}
      {/* Mobile: Verify FAB */}
      <button
        onClick={() => navigate('/verify')}
        aria-label={t.nav.verify}
        className={`md:hidden fixed right-4 bottom-20 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          pathname === '/verify'
            ? 'bg-primary/80 text-primary-foreground'
            : 'bg-primary text-primary-foreground active:bg-primary/80'
        }`}
      >
        <QrCode size={24} />
      </button>
      <Navigation />
    </div>
  )
}
