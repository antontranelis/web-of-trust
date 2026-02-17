import { NavLink } from 'react-router-dom'
import { Fingerprint, Users, QrCode, Award, Home } from 'lucide-react'
import { useLanguage } from '../../i18n'

export function Navigation() {
  const { t } = useLanguage()

  const navItems = [
    { to: '/', icon: Home, label: t.nav.home },
    { to: '/identity', icon: Fingerprint, label: t.nav.identity },
    { to: '/contacts', icon: Users, label: t.nav.contacts },
    { to: '/verify', icon: QrCode, label: t.nav.verify },
    { to: '/attestations', icon: Award, label: t.nav.attestations },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:relative md:border-t-0 md:border-r md:h-screen md:w-64">
      <ul className="flex md:flex-col justify-around md:justify-start md:p-4 md:gap-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-3 p-3 md:px-4 md:py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-xs md:text-sm font-medium">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
