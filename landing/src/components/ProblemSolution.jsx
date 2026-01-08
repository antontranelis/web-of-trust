import { UserCheck, Share2, Award, ArrowRight } from 'lucide-react'

const problems = [
  { before: 'Globale Plattformen, lokale Einsamkeit', after: 'Menschen im echten Leben zusammenbringen' },
  { before: 'Daten bei Konzernen', after: 'Daten bei dir' },
  { before: 'Vertrauen durch Sternebewertungen', after: 'Vertrauen durch persönliche Begegnungen' },
  { before: 'Account-Erstellung alleine am Bildschirm', after: 'Onboarding durch einen Menschen' },
  { before: 'Abhängigkeit von Servern', after: 'Funktioniert offline' },
]

const pillars = [
  {
    icon: UserCheck,
    title: 'Verifizieren',
    description: 'Identität durch persönliches Treffen bestätigen',
    color: 'primary',
    detail: 'Jede Beziehung beginnt mit einer echten Begegnung. Durch QR-Code-Scan bestätigst du: "Das ist wirklich diese Person."'
  },
  {
    icon: Share2,
    title: 'Kooperieren',
    description: 'Verschlüsselte Inhalte teilen',
    color: 'secondary',
    detail: 'Teile Kalender, Orte und Projekte mit deinem Netzwerk. Alles Ende-zu-Ende verschlüsselt.'
  },
  {
    icon: Award,
    title: 'Attestieren',
    description: 'Sozialkapital durch echte Taten aufbauen',
    color: 'accent',
    detail: 'Bestätige was andere getan haben. Diese Attestationen bauen über Zeit sichtbares Vertrauen auf.'
  },
]

const colorClasses = {
  primary: {
    bg: 'bg-primary-100',
    text: 'text-primary-600',
    border: 'border-primary-200',
    gradient: 'from-primary-500 to-primary-600',
  },
  secondary: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-600',
    border: 'border-secondary-200',
    gradient: 'from-secondary-500 to-secondary-600',
  },
  accent: {
    bg: 'bg-accent-100',
    text: 'text-accent-600',
    border: 'border-accent-200',
    gradient: 'from-accent-500 to-accent-600',
  },
}

export default function ProblemSolution() {
  return (
    <section id="konzept" className="section-padding bg-white">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="heading-2 text-slate-900 mb-4">
            Ein anderer Ansatz
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Statt globaler Plattformen setzen wir auf lokale Gemeinschaften.
            Statt Algorithmen auf echte Begegnungen.
          </p>
        </div>

        {/* Problem/Solution Comparison */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="text-center md:text-right">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Heute</h3>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-secondary-600 uppercase tracking-wider mb-4">Besser</h3>
            </div>
          </div>

          <div className="space-y-3 max-w-4xl mx-auto">
            {problems.map((item, index) => (
              <div key={index} className="grid md:grid-cols-2 gap-4 items-center">
                <div className="bg-slate-100 rounded-lg p-4 text-center md:text-right">
                  <span className="text-slate-500">{item.before}</span>
                </div>
                <div className="bg-secondary-50 rounded-lg p-4 text-center md:text-left border border-secondary-200">
                  <span className="text-secondary-700 font-medium">{item.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Three Pillars */}
        <div className="mb-12">
          <h3 className="heading-3 text-center text-slate-900 mb-12">
            Die drei Säulen
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => {
              const colors = colorClasses[pillar.color]
              const Icon = pillar.icon

              return (
                <div key={index} className="relative">
                  {/* Connector Arrow (except last) */}
                  {index < pillars.length - 1 && (
                    <div className="hidden md:block absolute top-1/4 -right-4 z-10">
                      <ArrowRight className="text-slate-300" size={24} />
                    </div>
                  )}

                  <div className={`card border ${colors.border} h-full`}>
                    <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={colors.text} size={28} />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">
                      {pillar.title}
                    </h4>
                    <p className={`${colors.text} font-medium mb-3`}>
                      {pillar.description}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {pillar.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Important Note */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
            <h4 className="font-semibold text-primary-900 mb-2">
              Verifizieren ≠ Vertrauen
            </h4>
            <p className="text-primary-700">
              Die Verifizierung bestätigt nur: "Das ist wirklich diese Person."
              Das eigentliche Vertrauen entsteht durch Attestationen über Zeit.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
