import { Flower2, Wrench, Code2, Users } from 'lucide-react'

const personas = [
  {
    icon: Flower2,
    image: '/farmer.svg',
    name: 'Hanna (62)',
    role: 'Die Gärtnerin',
    background: 'Aktiv im Gemeinschaftsgarten, nicht technikaffin, nutzt hauptsächlich WhatsApp.',
    needs: [
      'Wissen wer wann gießt',
      'Neue Helfer finden',
      'Sich nicht mit Technik beschäftigen müssen',
    ],
    howItHelps: 'Ihr Nachbar Tom richtet die App ein und verifiziert sie. Sie sieht den Gartenkalender und kann mit einem Tipp "Danke" sagen - das wird zur Attestation.',
    color: 'green',
  },
  {
    icon: Wrench,
    image: '/maker.svg',
    name: 'Alexander (34)',
    role: 'Der Macher',
    background: 'Kann alles reparieren, kennt viele Leute, organisiert Nachbarschaftshilfe.',
    needs: [
      'Überblick wer was kann',
      'Anfragen koordinieren',
      'Kein WhatsApp-Gruppen-Chaos',
    ],
    howItHelps: 'Verifiziert aktiv neue Leute bei Treffen. Erstellt Attestationen: "Kann Fahrräder", "Kann Elektrik". Sieht auf der Karte wer was anbietet.',
    color: 'orange',
  },
  {
    icon: Code2,
    image: '/lena.svg',
    name: 'Lena (28)',
    role: 'Die Skeptikerin',
    background: 'Softwareentwicklerin, Privacy-bewusst, hat schon viele "dezentrale" Projekte scheitern sehen.',
    needs: [
      'Verstehen wie es technisch funktioniert',
      'Sicher sein dass Daten verschlüsselt sind',
      'Kein Vendor-Lock-in',
    ],
    howItHelps: 'Open Source - kann den Code prüfen. E2E-Verschlüsselung mit lokalen Schlüsseln. Alle Daten exportierbar.',
    color: 'blue',
  },
  {
    icon: Users,
    image: '/family.svg',
    name: 'Familie Kowalski',
    role: 'Die Neuzugezogenen',
    background: 'Neu in der Stadt, kennen niemanden, wollen Anschluss finden.',
    needs: [
      'Nachbarn kennenlernen',
      'Vertrauenswürdige Angebote finden',
      'Teil einer Gemeinschaft werden',
    ],
    howItHelps: 'Beim Straßenfest erste Verifizierungen. Sehen sofort wer schon Attestationen hat. Können selbst Attestationen sammeln.',
    color: 'purple',
  },
]

const colorClasses = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200',
    badge: 'bg-green-50 text-green-700',
    dot: 'bg-green-500',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-200',
    badge: 'bg-orange-50 text-orange-700',
    dot: 'bg-orange-500',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-purple-50 text-purple-700',
    dot: 'bg-purple-500',
  },
}

export default function Personas() {
  return (
    <section id="personas" className="section-padding bg-white">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="heading-2 text-slate-900 mb-4">
            Für wen ist das Web of Trust?
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Menschen aus lokalen Gemeinschaften, die echte Verbindungen aufbauen wollen.
          </p>
        </div>

        {/* Persona Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {personas.map((persona, index) => {
            const colors = colorClasses[persona.color]
            const Icon = persona.icon

            return (
              <div key={index} className={`card border ${colors.border}`}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center overflow-hidden`}>
                    {persona.image ? (
                      <img src={persona.image} alt={persona.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-5xl">{persona.emoji}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {persona.name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.badge} mt-1`}>
                      {persona.role}
                    </span>
                  </div>
                </div>

                {/* Background */}
                <p className="text-slate-600 mb-4">
                  {persona.background}
                </p>

                {/* Needs */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Bedürfnisse
                  </h4>
                  <ul className="space-y-1">
                    {persona.needs.map((need, needIndex) => (
                      <li key={needIndex} className="flex items-center gap-2 text-slate-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {need}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How It Helps */}
                <div className={`${colors.bg} rounded-xl p-4`}>
                  <h4 className={`text-sm font-semibold ${colors.text} mb-2`}>
                    Wie Web of Trust hilft
                  </h4>
                  <p className="text-slate-700 text-sm">
                    {persona.howItHelps}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Das Netzwerk wächst nur durch echte Begegnungen - das dauert, aber das ist der Punkt.
            Keine Masseneinladungen, keine Fake-Accounts.
          </p>
        </div>
      </div>
    </section>
  )
}
