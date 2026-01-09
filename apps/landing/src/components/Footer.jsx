import { Github, FileText, MessageCircle, Heart } from 'lucide-react'

const links = {
  projekt: [
    { label: 'Konzept', href: 'https://github.com/antontranelis/web-of-trust-concept' },
    { label: 'Prototyp', href: 'https://github.com/antontranelis/web-of-trust-concept' },
    { label: 'Spezifikation', href: 'https://github.com/antontranelis/web-of-trust-concept' },
  ],
  mitmachen: [
    { label: 'GitHub Issues', href: 'https://github.com/antontranelis/web-of-trust-concept/issues' },
    { label: 'Feedback geben', href: 'https://github.com/antontranelis/web-of-trust-concept/discussions' },
    { label: 'Code beitragen', href: 'https://github.com/antontranelis/web-of-trust-concept/pulls' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* CTA Section */}
      <div className="section-container py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Bereit für echte Verbindungen?
          </h2>
          <p className="text-slate-400 mb-8">
            Wir suchen Gemeinschaften die es ausprobieren wollen, Feedback zu UX und Konzept, und Entwickler die mitbauen wollen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/antontranelis/web-of-trust-concept"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Github size={20} />
              Auf GitHub ansehen
            </a>
            <a
              href="https://github.com/antontranelis/web-of-trust-concept"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              <FileText size={20} />
              Spezifikation lesen
            </a>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="border-t border-slate-800">
        <div className="section-container py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-white rotate-12" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <circle cx="7" cy="8" r="2" />
                    <circle cx="17" cy="8" r="2" />
                    <circle cx="12" cy="17" r="2" />
                    <path d="M7 8L17 8M7 8L12 17M17 8L12 17" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
                <span className="font-bold text-lg">Web of Trust</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Dezentrales Vertrauensnetzwerk für lokale Gemeinschaften.
                Ein Forschungsprojekt das echte Begegnungen über Algorithmen stellt.
              </p>
            </div>

            {/* Project Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Projekt</h3>
              <ul className="space-y-2">
                {links.projekt.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mitmachen Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Mitmachen</h3>
              <ul className="space-y-2">
                {links.mitmachen.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="section-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              Open Source unter MIT Lizenz
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              Gemacht mit <Heart size={14} className="text-red-500" /> für lokale Gemeinschaften
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
