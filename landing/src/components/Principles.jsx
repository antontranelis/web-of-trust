import { Lock, Users, WifiOff, Github, Ban, Database, Key, RefreshCw } from 'lucide-react'

const principles = [
  {
    icon: Lock,
    title: 'Daten bei dir',
    description: 'Alle deine Daten liegen verschlüsselt auf deinem Gerät. Nur Leute die du verifiziert hast können sie entschlüsseln.',
    color: 'primary',
  },
  {
    icon: Users,
    title: 'Echte Begegnungen',
    description: 'Jede Beziehung im Netzwerk basiert auf einer persönlichen Begegnung. Das verhindert Fake-Accounts und Spam.',
    color: 'secondary',
  },
  {
    icon: WifiOff,
    title: 'Funktioniert offline',
    description: 'Content erstellen, Leute verifizieren, Attestationen vergeben - alles geht auch ohne Internet. Sync erfolgt später.',
    color: 'accent',
  },
  {
    icon: Github,
    title: 'Open Source',
    description: 'Der gesamte Code ist öffentlich. Du kannst prüfen wie es funktioniert und sogar selbst beitragen.',
    color: 'slate',
  },
  {
    icon: Key,
    title: 'Du hast den Schlüssel',
    description: 'Deine kryptographische Identität gehört dir. Mit der Recovery-Phrase kannst du sie jederzeit wiederherstellen.',
    color: 'primary',
  },
  {
    icon: Database,
    title: 'Daten exportierbar',
    description: 'Kein Vendor-Lock-in. Du kannst alle deine Daten jederzeit exportieren und mitnehmen.',
    color: 'secondary',
  },
]

const notFeatures = [
  { icon: Ban, text: 'Kein Social Media zum Scrollen' },
  { icon: Ban, text: 'Keine Blockchain oder Krypto-Token' },
  { icon: Ban, text: 'Keine Werbung oder Tracking' },
  { icon: Ban, text: 'Keine Algorithmen die entscheiden was du siehst' },
]

const colorClasses = {
  primary: {
    bg: 'bg-primary-100',
    text: 'text-primary-600',
  },
  secondary: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-600',
  },
  accent: {
    bg: 'bg-accent-100',
    text: 'text-accent-600',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  },
}

export default function Principles() {
  return (
    <section className="section-padding bg-slate-50">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="heading-2 text-slate-900 mb-4">
            Unsere Prinzipien
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Was das Web of Trust ausmacht - und was es bewusst nicht ist.
          </p>
        </div>

        {/* Principles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {principles.map((principle, index) => {
            const colors = colorClasses[principle.color]
            const Icon = principle.icon

            return (
              <div key={index} className="card">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={colors.text} size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {principle.title}
                </h3>
                <p className="text-slate-600 text-sm">
                  {principle.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* What It's Not */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-6 text-center">
              Was Web of Trust <span className="text-red-400">nicht</span> ist
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {notFeatures.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3">
                    <Icon className="text-red-400 flex-shrink-0" size={20} />
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500">
            <RefreshCw size={16} />
            <span className="text-sm">
              Dies ist ein Forschungsprojekt - wir lernen und verbessern kontinuierlich
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
