import { QrCode, Eye, MessageSquarePlus, CheckCircle2 } from 'lucide-react'

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
    detail: 'Diese Verifizierung wird kryptographisch signiert. Sie ist der Anker für alle weiteren Interaktionen.',
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
    icon: MessageSquarePlus,
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
          <div className="relative">
            {/* Vertical Line (desktop) */}
            <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-8 md:space-y-12">
              {steps.map((step, index) => {
                const colors = colorClasses[step.color]
                const Icon = step.icon

                return (
                  <div key={index} className="relative">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Step Number Circle */}
                      <div className="flex-shrink-0 flex items-start">
                        <div className={`w-20 h-20 ${colors.bg} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg relative z-10`}>
                          <Icon size={32} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <div className="card">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`text-sm font-bold ${colors.text}`}>
                              Schritt {step.number}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-2">
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
                    </div>
                  </div>
                )
              })}
            </div>
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
