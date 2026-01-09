import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Konzept', href: '#konzept' },
  { label: 'So funktioniert\'s', href: '#how-it-works' },
  { label: 'Anwendungen', href: '#personas' },
  { label: 'FAQ', href: '#faq' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <nav className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white rotate-12" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <circle cx="7" cy="8" r="2" />
                <circle cx="17" cy="8" r="2" />
                <circle cx="12" cy="17" r="2" />
                <path d="M7 8L17 8M7 8L12 17M17 8L12 17" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900">Web of Trust</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://github.com/antontranelis/web-of-trust-concept"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm py-2"
            >
              GitHub
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-base font-medium text-slate-600 hover:text-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="https://github.com/antontranelis/web-of-trust-concept"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm py-2 text-center"
              >
                GitHub
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
