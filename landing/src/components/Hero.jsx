import { ArrowDown, Users, Shield, Sparkles } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Floating Connection Lines */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full text-primary-400">
            <circle cx="50" cy="50" r="8" fill="currentColor" />
            <circle cx="150" cy="50" r="8" fill="currentColor" />
            <circle cx="100" cy="150" r="8" fill="currentColor" />
            <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="50" x2="100" y2="150" stroke="currentColor" strokeWidth="2" />
            <line x1="150" y1="50" x2="100" y2="150" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full text-secondary-400">
            <circle cx="50" cy="100" r="8" fill="currentColor" />
            <circle cx="150" cy="100" r="8" fill="currentColor" />
            <circle cx="100" cy="50" r="8" fill="currentColor" />
            <circle cx="100" cy="150" r="8" fill="currentColor" />
            <line x1="50" y1="100" x2="150" y2="100" stroke="currentColor" strokeWidth="2" />
            <line x1="100" y1="50" x2="100" y2="150" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-8">
            <Sparkles size={16} />
            <span>Open Source Forschungsprojekt</span>
          </div>

          {/* Main Headline */}
          <h1 className="heading-1 text-slate-900 mb-6">
            Vertrauen entsteht durch{' '}
            <span className="text-primary-600">echte Begegnungen</span>
          </h1>

          {/* Subheadline */}
          <p className="text-body max-w-2xl mx-auto mb-10">
            Ein dezentrales Vertrauensnetzwerk für lokale Gemeinschaften.
            Menschen vernetzen sich basierend auf echten Begegnungen statt Algorithmen.
            Deine Daten bleiben bei dir.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="#konzept" className="btn-primary">
              Mehr erfahren
            </a>
            <a
              href="https://github.com/IT4Change/web-of-trust"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Auf GitHub ansehen
            </a>
          </div>

          {/* Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Users size={20} className="text-primary-600" />
              </div>
              <span className="font-medium">Persönliche Verifizierung</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                <Shield size={20} className="text-secondary-600" />
              </div>
              <span className="font-medium">Ende-zu-Ende verschlüsselt</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v6m0 8v6M2 12h6m8 0h6" />
                </svg>
              </div>
              <span className="font-medium">Funktioniert offline</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#konzept" className="text-slate-400 hover:text-primary-600 transition-colors">
            <ArrowDown size={24} />
          </a>
        </div>
      </div>
    </section>
  )
}
