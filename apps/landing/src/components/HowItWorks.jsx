import { QrCode, Eye, BadgeCheck, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: QrCode,
    title: 'QR-Code scannen',
    description: 'Anna und Ben treffen sich. Ben scannt Annas QR-Code mit der App.',
    detail: 'Der QR-Code enthält Annas öffentlichen Schlüssel. Bens App erstellt automatisch seine eigene Identität.',
    color: 'primary',
  },
  {
    number: '02',
    icon: CheckCircle2,
    title: 'Identität bestätigen',
    description: 'Ben bestätigt: "Ich habe Anna persönlich getroffen."',
    detail: 'Diese Verifizierung wird kryptographisch signiert und gleichzeitig werden Schlüssel getauscht.',
    color: 'primary',
  },
  {
    number: '03',
    icon: Eye,
    title: 'Content sehen',
    description: 'Ben kann jetzt Annas geteilte Inhalte sehen.',
    detail: 'Kalender, Karten-Markierungen, Projekte - alles was Anna mit ihren Kontakten teilt, wird für Ben entschlüsselbar.',
    color: 'secondary',
  },
  {
    number: '04',
    icon: BadgeCheck,
    title: 'Attestation erstellen',
    description: 'Nach gemeinsamer Arbeit: Anna attestiert Bens Hilfe.',
    detail: '"Ben hat 3 Stunden im Garten geholfen" - diese signierte Aussage wird Teil von Bens Profil.',
    color: 'accent',
  },
]

const colorClasses = {
  primary: {
    bg: 'bg-primary-600',
    light: 'bg-primary-100',
    text: 'text-primary-600',
    border: 'border-primary-600',
  },
  secondary: {
    bg: 'bg-secondary-600',
    light: 'bg-secondary-100',
    text: 'text-secondary-600',
    border: 'border-secondary-600',
  },
  accent: {
    bg: 'bg-accent-500',
    light: 'bg-accent-100',
    text: 'text-accent-600',
    border: 'border-accent-500',
  },
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-slate-50">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="heading-2 text-slate-900 mb-4">
            So funktioniert's
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Vom ersten Treffen bis zur ersten Attestation - der Weg ins Netzwerk.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step, index) => {
                const colors = colorClasses[step.color]
                const Icon = step.icon
                const isEven = index % 2 === 0

                return (
                  <div key={index} className="relative pt-8">
                    {/* Icon überlappt die Karte */}
                    <div className={`absolute top-0 md:left-4 ${isEven ? 'left-4' : 'right-4'} z-10`}>
                      <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                        <Icon size={32} />
                      </div>
                    </div>

                    <div className="card pt-12">
                      <span className={`text-sm font-bold ${colors.text}`}>
                        Schritt {step.number}
                      </span>
                      <h3 className="text-xl font-semibold text-slate-900 mt-1 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-slate-600 mb-3">
                        {step.description}
                      </p>
                      <p className="text-sm text-slate-500 border-t border-slate-100 pt-3">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Result Box */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">
              Das Ergebnis
            </h3>
            <p className="text-primary-100">
              Ein wachsendes Netzwerk aus echten Beziehungen. Jede Verbindung basiert auf einer persönlichen Begegnung.
              Jede Attestation auf einer echten Tat.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
