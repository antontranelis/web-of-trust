/**
 * Audience-specific content variations
 *
 * Philosophy that permeates everything:
 * - Gegenseitige Unterstützung im privaten Rahmen ohne externes Geld
 * - Mehr Zeit, bessere Lebensqualität, weniger Lohnarbeit, weniger Konsum, mehr Freunde
 * - Balance zwischen Online-Kollaboration und echten Face-to-Face-Kontakten
 * - Freier Austausch, Vertrauen, lokale Beziehungen
 * - "Leichtigkeit!" - "Wenn Du wüsstest wie einfach das Leben ist, dann würdest Du lachen"
 */

export const audienceContent = {
  // ===========================================
  // DEFAULT - Allgemeine Perspektive
  // ===========================================
  default: {
    hero: {
      tagline: 'Soziale Technologie',
      title: 'Vertrauen verbindet',
      subtitle: 'Ein Netzwerk für echte Beziehungen. Keine Follower, keine Likes – nur Menschen, die sich wirklich kennen.',
      cta: 'Mehr erfahren',
      ctaSecondary: 'Wie funktioniert das?',
    },
    philosophy: {
      headline: 'Leichtigkeit',
      quote: 'Wenn Du wüsstest wie einfach das Leben ist, dann würdest Du lachen.',
      description: 'Web of Trust ist eine soziale Technologie, die uns wieder mit dem verbindet, was wirklich zählt: echte Menschen, echte Begegnungen, echte Unterstützung.',
    },
    problemSolution: {
      problemTitle: 'Das Problem',
      problemText: 'Soziale Netzwerke haben uns voneinander entfernt. Wir haben tausende "Freunde", aber niemanden, der beim Umzug hilft.',
      solutionTitle: 'Die Lösung',
      solutionText: 'Ein Netzwerk, das auf echten Begegnungen basiert. Jede Verbindung entsteht durch persönliches Treffen.',
    },
    values: [
      { title: 'Echte Begegnungen', description: 'Jede Verbindung beginnt offline, von Angesicht zu Angesicht.' },
      { title: 'Gegenseitige Hilfe', description: 'Unterstützung ohne Geld – Zeit und Fähigkeiten teilen.' },
      { title: 'Lokale Gemeinschaft', description: 'Stärke deine Nachbarschaft, nicht deinen Feed.' },
    ],
    useCases: [
      { title: 'Nachbarschaftshilfe', description: 'Finde vertrauenswürdige Helfer in deiner Nähe.' },
      { title: 'Gemeinschaftsgarten', description: 'Koordiniere Aufgaben mit echten Menschen.' },
      { title: 'Reparatur-Café', description: 'Teile Fähigkeiten und lerne von anderen.' },
    ],
  },

  // ===========================================
  // SPIRITUAL - Spirituelle Perspektive
  // ===========================================
  spiritual: {
    hero: {
      tagline: 'Verbundenheit leben',
      title: 'Wir sind eins',
      subtitle: 'Ein Raum für authentische Begegnungen. Wo Geben und Nehmen natürlich fließen – wie der Atem.',
      cta: 'Den Kreis betreten',
      ctaSecondary: 'Die Philosophie dahinter',
    },
    philosophy: {
      headline: 'Leichtigkeit des Seins',
      quote: 'Wenn Du wüsstest wie einfach das Leben ist, dann würdest Du lachen.',
      description: 'Web of Trust ist ein Weg zurück zur natürlichen Verbundenheit. Es erinnert uns daran, dass wir nie getrennt waren – von uns selbst, voneinander, von der Erde.',
    },
    problemSolution: {
      problemTitle: 'Die Illusion der Trennung',
      problemText: 'Die digitale Welt hat uns in Blasen isoliert. Wir scrollen durch Leben anderer, statt unser eigenes zu leben. Die Sehnsucht nach echter Verbindung wächst.',
      solutionTitle: 'Der Weg zurück',
      solutionText: 'Ein Netzwerk, das Präsenz fordert. Jede Verbindung ist eine bewusste Entscheidung, einem Menschen wirklich zu begegnen.',
    },
    values: [
      { title: 'Präsenz', description: 'Jede Verbindung beginnt im Hier und Jetzt, Auge in Auge.' },
      { title: 'Fließender Austausch', description: 'Geben und Nehmen ohne Berechnung – wie in der Natur.' },
      { title: 'Erdung', description: 'Lokale Beziehungen, die uns mit unserem Ort verbinden.' },
    ],
    useCases: [
      { title: 'Heilkreise', description: 'Finde Gleichgesinnte für gemeinsame Praxis.' },
      { title: 'Gemeinschaftsgarten', description: 'Mit der Erde arbeiten, mit Menschen wachsen.' },
      { title: 'Tauschkreise', description: 'Teile deine Gaben, empfange die Gaben anderer.' },
    ],
  },

  // ===========================================
  // ENTREPRENEUR - Unternehmer Perspektive
  // ===========================================
  entrepreneur: {
    hero: {
      tagline: 'Vertrauen als Kapital',
      title: 'Das wertvollste Netzwerk',
      subtitle: 'Echte Beziehungen sind der beste Business-Case. Ein Netzwerk, das auf Reputation und persönlicher Empfehlung basiert.',
      cta: 'Netzwerk aufbauen',
      ctaSecondary: 'ROI verstehen',
    },
    philosophy: {
      headline: 'Beyond Transactions',
      quote: 'Die besten Geschäfte entstehen, wenn Geld keine Rolle spielt.',
      description: 'Web of Trust zeigt: Soziales Kapital ist das nachhaltigste Investment. Wer ein starkes Vertrauensnetzwerk aufbaut, braucht weniger Marketing und mehr Empfehlungen.',
    },
    problemSolution: {
      problemTitle: 'Das Netzwerk-Problem',
      problemText: 'LinkedIn-Kontakte, die nie antworten. Visitenkarten, die verstauben. Professionelle Netzwerke ohne echte Substanz.',
      solutionTitle: 'Qualität vor Quantität',
      solutionText: 'Ein Netzwerk aus Menschen, die dich wirklich kennen – und für dich bürgen würden.',
    },
    values: [
      { title: 'Verifizierte Reputation', description: 'Attestationen statt leerer Endorsements.' },
      { title: 'Verlässliche Partner', description: 'Finde Menschen, die andere auch wirklich getroffen haben.' },
      { title: 'Lokale Wertschöpfung', description: 'Stärke die Wirtschaft in deiner Region.' },
    ],
    useCases: [
      { title: 'Empfehlungsnetzwerk', description: 'Kunden empfehlen dich an verifizierte Kontakte.' },
      { title: 'Skill-Sharing', description: 'Tausche Expertise ohne Rechnungen.' },
      { title: 'Mastermind-Gruppen', description: 'Bilde vertrauensvolle Unternehmer-Kreise.' },
    ],
  },

  // ===========================================
  // ACTIVIST - Aktivisten Perspektive
  // ===========================================
  activist: {
    hero: {
      tagline: 'Systemwandel von unten',
      title: 'Die Zukunft organisieren',
      subtitle: 'Ein dezentrales Netzwerk für resiliente Gemeinschaften. Ohne Plattform-Kapitalismus, ohne Überwachung.',
      cta: 'Bewegung starten',
      ctaSecondary: 'Warum dezentral?',
    },
    philosophy: {
      headline: 'Solidarität statt Konsum',
      quote: 'Die Revolution findet im Alltag statt – in jeder Hilfe, die wir uns gegenseitig geben.',
      description: 'Web of Trust ist gelebte Systemkritik: Weniger Lohnarbeit, weniger Konsum, mehr Zeit für das, was wirklich zählt. Eine Alternative zum kapitalistischen Hamsterrad.',
    },
    problemSolution: {
      problemTitle: 'Das System fragmentiert uns',
      problemText: 'Soziale Medien spalten. Algorithmen manipulieren. Konzerne profitieren von unserer Einsamkeit und verkaufen uns dann die Lösung.',
      solutionTitle: 'Autonome Infrastruktur',
      solutionText: 'Ein Netzwerk, das uns gehört. Ende-zu-Ende verschlüsselt, dezentral, ohne Werbung, ohne Datenhandel.',
    },
    values: [
      { title: 'Dezentralität', description: 'Keine Plattform-Kontrolle, keine Zensur.' },
      { title: 'Gegenseitige Hilfe', description: 'Solidarische Ökonomie im Kleinen.' },
      { title: 'Resilienz', description: 'Lokale Netzwerke, die Krisen überstehen.' },
    ],
    useCases: [
      { title: 'Solidarische Netzwerke', description: 'Organisiere Unterstützung ohne Bürokratie.' },
      { title: 'Nachbarschaftsräte', description: 'Demokratische Selbstorganisation.' },
      { title: 'Food-Coops', description: 'Teile Ressourcen mit verifizierten Mitgliedern.' },
    ],
  },

  // ===========================================
  // ENGINEER - Ingenieure Perspektive
  // ===========================================
  engineer: {
    hero: {
      tagline: 'Kryptographie trifft Social',
      title: 'Web of Trust 2.0',
      subtitle: 'did:key, Ed25519 Signaturen, E2E-Verschlüsselung. Ein modernes Trust-Framework auf solider Krypto-Basis.',
      cta: 'Technische Docs',
      ctaSecondary: 'Architektur ansehen',
    },
    philosophy: {
      headline: 'Simplicity is the ultimate sophistication',
      quote: 'Die eleganteste Lösung ist oft die einfachste.',
      description: 'Web of Trust beweist: Vertrauen lässt sich nicht skalieren – und das ist der Punkt. Ein System, das bewusst auf Viralität verzichtet, um Integrität zu garantieren.',
    },
    problemSolution: {
      problemTitle: 'Das Skalierungs-Paradox',
      problemText: 'Soziale Netzwerke optimieren für Engagement, nicht für Vertrauen. Je größer das Netzwerk, desto weniger bedeuten die Verbindungen.',
      solutionTitle: 'Trust by Design',
      solutionText: 'Verifizierung durch physische Präsenz. Kryptographische Signaturen. Lokaler Schlüsselspeicher. Sybil-resistent by design.',
    },
    values: [
      { title: 'did:key Standard', description: 'Selbst-souveräne Identitäten ohne Registry.' },
      { title: 'E2E Encryption', description: 'Der Server sieht nur verschlüsselte Blobs.' },
      { title: 'Offline-First', description: 'Funktioniert auch ohne Netzwerk.' },
    ],
    useCases: [
      { title: 'Dezentrale PKI', description: 'Public Key Infrastructure ohne Certificate Authority.' },
      { title: 'Reputation Systems', description: 'Attestationen als signierte Claims.' },
      { title: 'Secure Collaboration', description: 'Verschlüsselter Datenaustausch in Gruppen.' },
    ],
  },

  // ===========================================
  // JOURNALIST - Journalisten Perspektive
  // ===========================================
  journalist: {
    hero: {
      tagline: 'Die Vertrauenskrise lösen',
      title: 'Echte Menschen, echte Geschichten',
      subtitle: 'In einer Welt voller Fake-Accounts und Bots: Ein Netzwerk, in dem jede Verbindung auf einer echten Begegnung basiert.',
      cta: 'Story entdecken',
      ctaSecondary: 'Hintergrund lesen',
    },
    philosophy: {
      headline: 'Back to Basics',
      quote: 'Vertrauen entsteht nicht durch Klicks, sondern durch Handschläge.',
      description: 'Web of Trust ist die Antwort auf die Vertrauenskrise der digitalen Welt. Es zeigt: Technologie kann Gemeinschaft stärken, statt sie zu zerstören.',
    },
    problemSolution: {
      problemTitle: 'Die Krise der Authentizität',
      problemText: 'Fake News, Bots, Manipulation – wir wissen nicht mehr, wem wir online vertrauen können. Die großen Plattformen haben versagt.',
      solutionTitle: 'Verifizierte Identitäten',
      solutionText: 'Jede Verbindung erfordert ein persönliches Treffen. Keine Follower, die du nie gesehen hast. Keine Freunde, die Algorithmen sind.',
    },
    values: [
      { title: 'Nachprüfbare Beziehungen', description: 'Jede Verbindung hat einen Ursprung in der echten Welt.' },
      { title: 'Graswurzel-Bewegung', description: 'Wächst organisch durch persönliche Empfehlung.' },
      { title: 'Datensouveränität', description: 'Nutzer kontrollieren ihre eigenen Daten.' },
    ],
    useCases: [
      { title: 'Nachbarschafts-Initiativen', description: 'Gemeinschaftsgärten, Reparatur-Cafés, Tauschkreise.' },
      { title: 'Vertrauensnetzwerke', description: 'Handwerker-Empfehlungen, Babysitter, Nachbarschaftshilfe.' },
      { title: 'Lokale Resilienz', description: 'Gemeinschaften, die Krisen gemeinsam bewältigen.' },
    ],
  },

  // ===========================================
  // ARTIST - Künstler Perspektive
  // ===========================================
  artist: {
    hero: {
      tagline: 'Kreativität braucht Vertrauen',
      title: 'Ein Raum für echten Austausch',
      subtitle: 'Jenseits von Likes und Followern. Ein Netzwerk, in dem Kunst durch Begegnung entsteht – nicht durch Algorithmen.',
      cta: 'Raum betreten',
      ctaSecondary: 'Die Vision',
    },
    philosophy: {
      headline: 'Kunst ist Begegnung',
      quote: 'Die schönsten Kollaborationen entstehen, wenn Menschen sich wirklich sehen.',
      description: 'Web of Trust schafft den Rahmen für authentische kreative Zusammenarbeit. Keine Selbstvermarktung, kein Engagement-Hack – nur Menschen, die sich gegenseitig inspirieren.',
    },
    problemSolution: {
      problemTitle: 'Der Content-Hamsterrad',
      problemText: 'Social Media zwingt Künstler zur permanenten Selbstvermarktung. Der Algorithmus belohnt Quantität, nicht Qualität. Kreativität wird zum Performance-Akt.',
      solutionTitle: 'Befreiung vom Algorithmus',
      solutionText: 'Ein Netzwerk ohne Feed, ohne Likes, ohne Follower-Zahlen. Nur echte Menschen, die deine Arbeit wirklich kennen.',
    },
    values: [
      { title: 'Echte Resonanz', description: 'Feedback von Menschen, die dich getroffen haben.' },
      { title: 'Kollaboration', description: 'Finde Mitstreiter durch persönliche Empfehlung.' },
      { title: 'Freier Austausch', description: 'Teile Fähigkeiten ohne Geld – Kunst gegen Kunst.' },
    ],
    useCases: [
      { title: 'Künstler-Kollektive', description: 'Vertrauensvolle Zusammenarbeit in Gruppen.' },
      { title: 'Skill-Sharing', description: 'Gitarrenunterricht gegen Grafikdesign.' },
      { title: 'Lokale Szene', description: 'Verbinde dich mit der Kreativ-Community vor Ort.' },
    ],
  },
}
