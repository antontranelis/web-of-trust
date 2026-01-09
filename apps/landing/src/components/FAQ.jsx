import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    category: 'Grundlagen',
    questions: [
      {
        q: 'Was unterscheidet das von WhatsApp-Gruppen?',
        a: 'Deine Daten liegen bei dir, nicht bei Meta. Alles funktioniert offline. Attestationen bauen sichtbare Reputation auf. Kein Gruppen-Chaos mit 200 ungelesenen Nachrichten.',
      },
      {
        q: 'Warum muss ich jemanden persönlich treffen?',
        a: 'Das ist der Kern des Konzepts. Die persönliche Verifizierung ist der Sybil-Resistenz-Mechanismus. Ohne sie könnte jeder 1000 Fake-Accounts erstellen.',
      },
      {
        q: 'Was sehe ich wenn ich niemanden verifiziert habe?',
        a: 'Nichts außer deinem eigenen Profil. Das Netzwerk ist nur so groß wie deine echten Beziehungen.',
      },
      {
        q: 'Kann ich Leute einladen ohne sie zu treffen?',
        a: 'Nein. Das ist Absicht. Jede Beziehung im Netzwerk basiert auf einer echten Begegnung.',
      },
    ],
  },
  {
    category: 'Vertrauen & Attestationen',
    questions: [
      {
        q: 'Was ist der Unterschied zwischen Verifizierung und Attestation?',
        a: 'Verifizierung: "Ich habe diese Person getroffen, das ist wirklich sie." Attestation: "Diese Person hat X getan / kann Y." Verifizierung ist der Identitätsanker. Attestationen sind das eigentliche Vertrauen.',
      },
      {
        q: 'Kann ich eine Attestation zurücknehmen?',
        a: 'Nein. Attestationen sind signierte Aussagen über vergangene Ereignisse. Wenn sich die Beziehung ändert, erstellst du einfach keine neuen mehr.',
      },
      {
        q: 'Was wenn jemand Mist baut?',
        a: 'Du blendest die Person aus. Sie behält ihre alten Attestationen (sie hat die guten Taten ja wirklich getan), aber du siehst ihren Content nicht mehr. Andere können das auch tun.',
      },
    ],
  },
  {
    category: 'Technisches',
    questions: [
      {
        q: 'Was passiert wenn ich mein Handy verliere?',
        a: 'Wenn du deine Recovery-Phrase hast: Alles wiederherstellbar. Wenn nicht: Deine digitale Identität ist weg. Du musst neu anfangen und dich erneut verifizieren lassen.',
      },
      {
        q: 'Wo liegen meine Daten?',
        a: 'Lokal auf deinem Gerät. Verschlüsselt. Nur Leute die du verifiziert hast können sie entschlüsseln.',
      },
      {
        q: 'Gibt es einen Server?',
        a: 'Für die Synchronisation zwischen Geräten braucht es Infrastruktur. Diese speichert aber nur verschlüsselte Blobs - der Betreiber kann nichts lesen.',
      },
    ],
  },
  {
    category: 'Skalierung & Grenzen',
    questions: [
      {
        q: 'Was wenn das 10.000 Leute nutzen?',
        a: 'Das Netzwerk "skaliert" nicht im klassischen Sinne. Du siehst immer nur den Content von Leuten die du verifiziert hast. Bei 10.000 Nutzern gibt es viele kleine, überlappende Netzwerke.',
      },
      {
        q: 'Kann ich Leute sehen die "Freunde von Freunden" sind?',
        a: 'Im Basisfall: Nein. Du siehst nur Content von Leuten die du selbst verifiziert hast. Erweiterungen für Vertrauensketten sind denkbar, aber nicht im ersten Schritt.',
      },
    ],
  },
]

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        className="w-full py-5 flex items-center justify-between text-left"
        onClick={onClick}
      >
        <span className="font-medium text-slate-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="flex-shrink-0 text-primary-600" size={20} />
        ) : (
          <ChevronDown className="flex-shrink-0 text-slate-400" size={20} />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 pr-8">
          <p className="text-slate-600">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <section id="faq" className="section-padding bg-white">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="heading-2 text-slate-900 mb-4">
            Häufig gestellte Fragen
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Antworten auf die wichtigsten Fragen zum Web of Trust.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-3xl mx-auto">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-10 last:mb-0">
              <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                {category.category}
              </h3>
              <div className="card">
                {category.questions.map((item, questionIndex) => (
                  <FAQItem
                    key={questionIndex}
                    question={item.q}
                    answer={item.a}
                    isOpen={openItems[`${categoryIndex}-${questionIndex}`]}
                    onClick={() => toggleItem(categoryIndex, questionIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* More Questions */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            Noch mehr Fragen?
          </p>
          <a
            href="https://github.com/antontranelis/web-of-trust-concept/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Auf GitHub stellen
          </a>
        </div>
      </div>
    </section>
  )
}
