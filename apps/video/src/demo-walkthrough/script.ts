/**
 * Demo Walkthrough Video — Voiceover Script
 *
 * Story: Lisa zieht neu in die Nachbarschaft und nutzt Web of Trust,
 * um Kontakte zu knüpfen. Sie verifiziert sich mit Marco, trägt ihre
 * Angebote ein, und gemeinsam legen sie ein Hochbeet an. Marco ist so
 * begeistert, dass er eine Verification Party organisiert — und die
 * ganze Nachbarschaft macht mit.
 *
 * Visuell: Zwei Phone-Mockups nebeneinander zeigen die App-Screens.
 * Die Stimme erklärt, was passiert, während die UI-Elemente animiert erscheinen.
 */

export const scenes = [
  {
    id: "01-intro",
    title: "Intro",
    voiceover: `Stell dir vor, du ziehst in eine neue Nachbarschaft. Du kennst noch niemanden. Wie findest du heraus, wer dir helfen kann — und wem du vertrauen kannst? Mit dem Web of Trust.`,
    visualCues: [
      "Häuserzeile / Nachbarschafts-Illustration",
      "Lisa-Avatar erscheint, Fragezeichen",
      "Web of Trust Logo + Titel",
    ],
  },
  {
    id: "02-identity",
    title: "Identität erstellen",
    voiceover: `Lisa öffnet die App und erstellt ihre digitale Identität. Zwölf magische Wörter werden generiert — ihr persönlicher Schlüssel, den nur sie kennt. Sie schreibt die Wörter auf, wählt ein Passwort, und gibt ihren Namen und eine kurze Beschreibung ein. Fertig — Lisa hat jetzt eine eigene, selbstbestimmte Identität. Keine E-Mail, kein Passwort-Reset, keine Firma, die ihre Daten speichert.`,
    visualCues: [
      "Phone links: Willkommen-Screen mit 'Identität generieren' Button",
      "Phone links: 12 Wörter im Grid (3x4), Sicherheits-Checkliste",
      "Phone links: Passwort-Eingabe mit Schlüssel-Icon",
      "Phone links: Profil-Formular (Name: Lisa, Bio, Avatar)",
      "Phone links: 'Geschafft!' Screen mit Konfetti",
    ],
  },
  {
    id: "03-first-contact",
    title: "Erste Begegnung & Verification",
    voiceover: `Am nächsten Tag trifft Lisa ihren Nachbarn Marco. Sie zeigt ihm die App und ihren QR-Code. Marco ist neugierig, installiert die App und erstellt auch eine Identität. Dann scannt er Lisas QR-Code. Auf beiden Handys erscheint die Frage: Stehst du vor dieser Person? Beide bestätigen — und die Verbindung steht.`,
    visualCues: [
      "Phone links (Lisa): QR-Code wird angezeigt",
      "Phone rechts (Marco): App installiert, Identität erstellt (schnell)",
      "Phone rechts (Marco): 'Code scannen' — Kamera auf Lisas QR",
      "Beide Phones: 'Stehst du vor dieser Person?' Dialog mit Avatar",
      "Beide Phones: Bestätigen-Button wird gedrückt",
      "Beide Phones: 'Verbindung erfolgreich!' mit Konfetti",
      "Beide Phones: Kontaktliste mit grünem 'Gegenseitig verbunden' Badge",
    ],
  },
  {
    id: "04-profile",
    title: "Angebote & Gesuche",
    voiceover: `Lisa trägt auf ihrem Profil ein, was sie anbieten kann und was sie sucht. Sie bietet Gartenarbeit und Kuchen backen an. Marco schaut sich Lisas Profil an und sieht ihre Angebote. Gartenarbeit — genau was er braucht!`,
    visualCues: [
      "Phone links (Lisa): Profil bearbeiten",
      "Phone links: Offers Tags (grün) erscheinen: 'Gartenarbeit', 'Kuchen backen'",
      "Phone links: Needs Tags (amber): 'Fahrrad-Reparatur', 'Kinderbetreuung'",
      "Phone rechts (Marco): Lisas Public Profile — Avatar, Bio, Verifikation",
      "Phone rechts: Scrollt zu Angebote — 'Gartenarbeit' leuchtet auf",
      "Phone rechts → Marcos eigenes Profil: Need 'Hilfe beim Hochbeet'",
    ],
  },
  {
    id: "05-hochbeet",
    title: "Das Hochbeet & erste Attestations",
    voiceover: `Lisa und Marco legen zusammen ein Hochbeet in Marcos Garten an. Danach erstellt Marco eine Bestätigung für Lisa. Er wählt Lisa aus, schreibt: Hat mir beim Hochbeet geholfen, super Gartenarbeit. Lisa bekommt die Bestätigung sofort auf ihr Handy und veröffentlicht sie auf ihrem Profil. Und Lisa schreibt über Marco: Toller Nachbar, teilt gerne seinen Garten. So entsteht Vertrauen — durch gemeinsame Erfahrungen.`,
    visualCues: [
      "Illustration: Hochbeet / Garten (kurz, Überleitung)",
      "Phone rechts (Marco): 'Bestätigung erstellen' — Lisa ausgewählt",
      "Phone rechts: Textfeld: 'Hat mir beim Hochbeet geholfen, super Gartenarbeit'",
      "Phone rechts: Tags: 'Garten', Button 'Bestätigung erstellen'",
      "Phone links (Lisa): Benachrichtigung — 'Du hast eine Bestätigung erhalten'",
      "Phone links: Attestation-Card, 'Veröffentlichen' Button",
      "Phone links (Lisa): Erstellt Attestation für Marco — 'Teilt gerne seinen Garten'",
      "Phone rechts (Marco): Erhält Lisas Attestation",
    ],
  },
  {
    id: "06-verification-party",
    title: "Die Verification Party",
    voiceover: `Marco ist begeistert. Er lädt die ganze Nachbarschaft ein — zur Verification Party! Alle kommen zusammen, installieren die App und verifizieren sich gegenseitig. Jeder zeigt seinen QR-Code, der Nächste scannt. Nach 20 Minuten hat jeder eine volle Kontaktliste. Und plötzlich sieht jeder was die anderen anzubieten und zu teilen haben.`,
    visualCues: [
      "Text-Overlay: 'Marcos Idee: Verification Party!' (groß, mittig)",
      "Mehrere Phone-Paare scannen sich gegenseitig (schnelle Montage, 3-4 Paare)",
      "Phone: Kontaktliste wächst — 2, 4, 7, 12 Kontakte animiert",
      "Kontakt-Cards: Sabine, Thomas, Yuki — alle 'Gegenseitig verbunden'",
    ],
  },
  {
    id: "07-community",
    title: "Die Nachbarschaft lebt auf",
    voiceover: `Und dann passiert etwas Wunderbares. Die Nachbarn fangen an, Dinge füreinander zu tun. Sabine gibt Yukis Tochter Klavierunterricht. Thomas repariert Lisas Fahrrad. Und nach jedem Gefallen hagelt es Attestations. Thomas schreibt über Sabine: Beste Klavierlehrerin. Yuki bestätigt Lisa: Organisiert fantastische Nachbarschaftstreffen. Jedes Profil füllt sich mit echten Bestätigungen von echten Menschen. Und immer mehr Nachbarn wollen mitmachen.`,
    visualCues: [
      "Split: Mini-Illustrationen der Aktivitäten (Klavier, Fahrrad)",
      "Phone: Attestation von Thomas für Sabine — 'Beste Klavierlehrerin'",
      "Phone: Attestation von Yuki für Lisa — 'Fantastische Nachbarschaftstreffen'",
      "Phone: Profil mit 4-5 Attestations aufgereiht",
      "Netzwerk-Visualisierung: Knoten + Verbindungslinien wachsen",
      "Neue Knoten docken an — das Netzwerk wächst",
    ],
  },
  {
    id: "08-outro",
    title: "Outro & Call to Action",
    voiceover: `Das ist das Web of Trust. Echte Verbindungen, echtes Vertrauen, echte Gemeinschaft — ganz ohne zentrale Plattform. Probier die Demo aus auf web-of-trust.de und organisiere deine eigene Verification Party.`,
    visualCues: [
      "Netzwerk-Visualisierung der ganzen Nachbarschaft",
      "Web of Trust Logo",
      "URL: web-of-trust.de/demo",
      "CTA: 'Starte deine eigene Verification Party!'",
    ],
  },
] as const;

// Estimated total: ~2:45 min
// Scene durations will be set after audio generation based on actual audio lengths
