// Voiceover script for Web of Trust Explainer Video
// REGEL: Jedes animierte Element wird beim Erscheinen benannt.
// Text und Animation sind 1:1 synchron.

export interface VoiceSegment {
  scene: string;
  text: string;
  file: string;
  // Animation cues — welches Element erscheint bei welchem Satz/Phrase
  cues: string[];
}

export const script: VoiceSegment[] = [
  {
    scene: "intro",
    file: "01-intro.mp3",
    text: "Web of Trust. Eine digitale Infrastruktur für echte Gemeinschaften. Dezentral, verschlüsselt, selbstbestimmt.",
    cues: [
      "Logo + 'Web of Trust'",
      "'Vertrauen durch echte Begegnungen'",
      "Tags: Dezentral • Verschlüsselt • Selbstbestimmt",
    ],
  },
  {
    scene: "problem",
    file: "02-problem.mp3",
    // Jede der 5 Vergleichszeilen wird einzeln angesprochen
    text: `Stell dir eine Alternative zu Social Media vor.
Heute bindet Social Media unsere Aufmerksamkeit — besser: sich im echten Leben verbinden.
Heute liegen deine Daten bei Konzernen — besser: deine Daten liegen bei dir.
Heute entsteht Vertrauen durch Likes und Sterne — besser: durch echte Begegnungen.
Heute erstellst du deinen Account alleine am Bildschirm — besser: deine Freunde bringen dich rein.
Und heute bist du abhängig von Servern und Empfang — besser: es funktioniert auch ohne Internet.`,
    cues: [
      "Header: 'Lokale Verbindungen'",
      "Zeile 1: Social Media → Echtes Leben",
      "Zeile 2: Daten bei Konzernen → Bei dir",
      "Zeile 3: Likes und Sterne → Echte Begegnungen",
      "Zeile 4: Account alleine → Onboarding durch Freunde",
      "Zeile 5: Server-abhängig → Offline-fähig",
    ],
  },
  {
    scene: "pillars",
    file: "03-pillars.mp3",
    // Jede der 3 Säulen wird mit Beschreibung vorgelesen
    text: `Drei Säulen tragen das Netzwerk.
Verbinden: Jede Beziehung beginnt mit einer echten Begegnung. Per QR-Code bestätigst du — das ist wirklich diese Person.
Kooperieren: Gemeinsam planen und handeln, mit Kalender, Karte und Marktplatz — alles Ende-zu-Ende verschlüsselt.
Bestätigen: Echte Taten und Hilfe anerkennen. Diese Bestätigungen bauen über Zeit sichtbares Vertrauen auf.`,
    cues: [
      "Header: 'Die drei Säulen'",
      "Karte 1: Verbinden (blau)",
      "Karte 2: Kooperieren (lila)",
      "Karte 3: Bestätigen (grün)",
    ],
  },
  {
    scene: "howItWorks",
    file: "04-howitworks.mp3",
    // Alle 4 Schritte mit Details
    text: `So funktioniert es — vom ersten Treffen bis zur ersten Bestätigung.
Schritt eins: Anna und Ben treffen sich. Ben scannt Annas QR-Code. Der Code enthält ihre digitale Identität.
Schritt zwei: Ben bestätigt — ich habe Anna persönlich getroffen. Diese Bestätigung wird digital signiert und sicher gespeichert.
Schritt drei: Jetzt können sie zusammenarbeiten. Kalender, Karten-Markierungen, Projekte — verschlüsselt nur für sie und die Menschen denen sie vertrauen.
Schritt vier: Nach gemeinsamer Arbeit bestätigt Anna Bens Beitrag. Ben hat drei Stunden im Garten geholfen — das wird Teil seines Profils.`,
    cues: [
      "Header: 'So funktioniert's'",
      "Schritt 01 aktiv: Treffen & verbinden",
      "Schritt 02 aktiv: Identität bestätigen",
      "Schritt 03 aktiv: Zusammen aktiv werden",
      "Schritt 04 aktiv: Bestätigung geben",
    ],
  },
  {
    scene: "apps",
    file: "05-apps.mp3",
    // Alle 4 Apps einzeln mit Beschreibung
    text: `Auf dieser Vertrauensebene bauen verschiedene Apps auf.
Die Karte: Finde Menschen, Orte und Angebote in deiner Nähe.
Der Kalender: Plane gemeinsame Aktionen und lade zu Events ein.
Der Marktplatz: Teile Angebote und Gesuche mit Menschen denen du vertraust.
Und Wertschätzung: Verschenke Zeit, Hilfe oder ein Dankeschön.
Alles gebaut auf dem Real Life Stack — Open Source.`,
    cues: [
      "Header: 'Was du damit machen kannst'",
      "Karte-Card erscheint",
      "Kalender-Card erscheint",
      "Marktplatz-Card erscheint",
      "Wertschätzung-Card erscheint",
      "Real Life Stack Badge",
    ],
  },
  {
    scene: "principles",
    file: "06-principles.mp3",
    // Alle 6 Prinzipien + alle 4 "Was es nicht ist"
    text: `Die Prinzipien hinter Web of Trust.
Daten bei dir: Alles liegt verschlüsselt auf deinem Gerät.
Echte Begegnungen: Jede Verbindung basiert auf einem persönlichen Treffen. Das verhindert Fake-Accounts und Spam.
Funktioniert offline: Alles geht auch ohne Internet — Sync erfolgt später.
Open Source: Der gesamte Code ist öffentlich. Du kannst prüfen wie es funktioniert.
Du hast den Schlüssel: Deine Identität gehört dir, wiederherstellbar per Recovery-Phrase.
Daten exportierbar: Kein Vendor-Lock-in — du kannst alles jederzeit mitnehmen.
Und was Web of Trust nicht ist: Kein Social Media zum Scrollen, keine Werbung oder Tracking, keine Algorithmen die entscheiden was du siehst, und keine Blockchain oder Crypto-Token.`,
    cues: [
      "Header: 'Die Prinzipien'",
      "Prinzip 1: Daten bei dir",
      "Prinzip 2: Echte Begegnungen",
      "Prinzip 3: Funktioniert offline",
      "Prinzip 4: Open Source",
      "Prinzip 5: Du hast den Schlüssel",
      "Prinzip 6: Daten exportierbar",
      "Badge 1-4: Was WoT nicht ist",
    ],
  },
  {
    scene: "outro",
    file: "07-outro.mp3",
    text: "Bereit für echte Verbindungen? Probiere die Demo auf web-of-trust.de — kostenlos und open source.",
    cues: [
      "Logo + CTA",
      "URL-Button: web-of-trust.de/demo",
      "GitHub-Link",
    ],
  },
];
