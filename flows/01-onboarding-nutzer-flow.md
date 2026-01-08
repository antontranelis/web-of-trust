# Onboarding-Flow (Nutzer-Perspektive)

> Wie ein neuer Nutzer ins Netzwerk kommt

## Übersicht: Zwei Wege ins Netzwerk

```mermaid
flowchart TD
    Start(["Neue Person will beitreten"]) --> How{"Wie?"}
    
    How -->|Eingeladen| Invited["Wird von bestehendem Nutzer gescannt"]
    How -->|Selbstständig| Solo["Erstellt ID alleine"]
    
    Invited --> Verify["Gegenseitige Verifizierung"]
    Verify --> Connected["Sofort vernetzt - Sieht Content"]
    
    Solo --> Alone["Hat ID aber leeres Netzwerk"]
    Alone --> Later["Muss später Menschen treffen"]
    Later --> Connected
    
    style Connected fill:#90EE90
    style Alone fill:#FFE4B5
```

## Hauptflow: Onboarding durch Einladung

```mermaid
sequenceDiagram
    participant A as Anna - Einladende
    participant B as Ben - Neu

    Note over A,B: Persönliches Treffen

    A->>B: Kennst du Web of Trust? Ich kann dich einladen
    B->>A: Nee, was ist das?
    A->>B: Eine App für unsere Nachbarschaft. Scann mal.
    
    rect rgb(230, 245, 255)
        Note over A,B: Phase 1 - App installieren
        A->>A: Zeigt QR-Code
        B->>B: Scannt mit Handy-Kamera
        B->>B: Link öffnet App Store
        B->>B: Installiert App
        B->>B: Öffnet App
    end

    rect rgb(255, 245, 230)
        Note over A,B: Phase 2 - Annas Profil sehen
        B->>B: App erkennt Du wurdest eingeladen
        B->>B: Sieht Annas Profil
        Note over B: Name, Foto, Bio, 23 Attestationen
    end

    rect rgb(245, 230, 255)
        Note over A,B: Phase 3 - Eigene ID erstellen
        B->>B: Um beizutreten erstelle deine Identität
        B->>B: Gibt Namen ein
        B->>B: Optional Foto und Bio
        B->>B: Tippt ID erstellen
        Note over B: Schlüssel werden generiert
    end

    rect rgb(255, 230, 230)
        Note over A,B: Phase 4 - Recovery-Phrase sichern VERPFLICHTEND
        B->>B: Sieht Recovery-Phrase mit 12 Wörtern
        Note over B: KRITISCH - NUR JETZT angezeigt!
        B->>B: Schreibt Wörter auf
        B->>B: Tippt Weiter
        B->>B: Quiz: Welches ist Wort 3?
        B->>B: Quiz: Welches ist Wort 7?
        B->>B: Quiz: Welches ist Wort 11?
        Note over B: Erst nach 3 richtigen Antworten weiter
    end

    rect rgb(230, 255, 230)
        Note over A,B: Phase 5 - Gegenseitige Verifizierung
        B->>B: Tippt Anna bestätigen
        B->>B: Zeigt eigenen QR-Code
        B->>A: Jetzt scannst du mich
        A->>B: Scannt Bens QR
        A->>A: Sieht Bens neues Profil
        A->>A: Tippt Identität bestätigen
    end

    Note over A,B: Ben ist im Netzwerk!
    Note over B: Sieht Annas Content - Kann eigenen Content teilen
```

## Variante: Selbstständiges Onboarding

```mermaid
sequenceDiagram
    participant B as Ben - alleine

    Note over B: Findet App im Store

    B->>B: Installiert App
    B->>B: Öffnet App
    
    rect rgb(245, 230, 255)
        Note over B: Eigene ID erstellen
        B->>B: Willkommen bei Web of Trust
        B->>B: Erstelle deine Identität
        B->>B: Gibt Namen ein
        B->>B: Optional Foto und Bio
        B->>B: Tippt ID erstellen
    end

    rect rgb(255, 230, 230)
        Note over B: Recovery-Phrase sichern VERPFLICHTEND
        B->>B: Sieht Recovery-Phrase
        B->>B: Schreibt sie auf
        B->>B: Quiz mit 3 Wörtern bestehen
    end

    rect rgb(255, 250, 230)
        Note over B: Leeres Netzwerk
        B->>B: Sieht Dashboard
        Note over B: Du hast noch keine Kontakte
        B->>B: Kann eigenes Profil bearbeiten
        B->>B: Kann QR-Code zeigen
        B->>B: Sieht keinen Content
    end

    Note over B: Wartet auf echte Begegnungen
```

## Was der Nutzer sieht

### Willkommens-Screen (eingeladen)

```
┌─────────────────────────────────┐
│                                 │
│      🌐 Web of Trust            │
│                                 │
│   Du wurdest eingeladen von:    │
│                                 │
│         📷 [Profilbild]         │
│          Anna Müller            │
│                                 │
│   "Aktiv im Gemeinschafts-      │
│    garten Sonnenberg"           │
│                                 │
│   ✅ 23 Attestationen           │
│   ✅ 47 Verifizierungen         │
│                                 │
├─────────────────────────────────┤
│                                 │
│   [ Jetzt beitreten ]           │
│                                 │
│   Was ist Web of Trust? ℹ️       │
│                                 │
└─────────────────────────────────┘
```

### Profil erstellen

```
┌─────────────────────────────────┐
│                                 │
│   Erstelle dein Profil          │
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │     📷 Foto hinzufügen  │   │
│   │       (optional)        │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   Name *                        │
│   ┌─────────────────────────┐   │
│   │ Ben Schmidt             │   │
│   └─────────────────────────┘   │
│                                 │
│   Über mich (optional)          │
│   ┌─────────────────────────┐   │
│   │ Neu in der Gegend,      │   │
│   │ interessiert an...      │   │
│   └─────────────────────────┘   │
│                                 │
│   [ Weiter ]                    │
│                                 │
└─────────────────────────────────┘
```

### Recovery-Phrase (VERPFLICHTEND)

```
┌─────────────────────────────────┐
│                                 │
│   🔐 Deine Recovery-Phrase      │
│                                 │
│   ⚠️  WICHTIG - LIES DAS!       │
│                                 │
│   Diese 12 Wörter werden dir    │
│   NUR JETZT angezeigt.          │
│   Sie können NICHT erneut       │
│   abgerufen werden!             │
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │  1. apple    7. forest  │   │
│   │  2. banana   8. garden  │   │
│   │  3. cherry   9. house   │   │
│   │  4. delta   10. iron    │   │
│   │  5. echo    11. jungle  │   │
│   │  6. frog    12. kite    │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   📝 Schreib sie JETZT auf      │
│   🚫 Mach keinen Screenshot     │
│   🔒 Bewahre sie sicher auf     │
│                                 │
│   [ Weiter zum Quiz ]           │
│                                 │
└─────────────────────────────────┘
```

### Phrase verifizieren (VERPFLICHTEND)

```
┌─────────────────────────────────┐
│                                 │
│   Bestätige deine Sicherung     │
│                                 │
│   Welches ist Wort Nummer 4?    │
│                                 │
│   ┌─────────┐ ┌─────────┐       │
│   │  delta  │ │  echo   │       │
│   └─────────┘ └─────────┘       │
│   ┌─────────┐ ┌─────────┐       │
│   │  frog   │ │  apple  │       │
│   └─────────┘ └─────────┘       │
│                                 │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   Frage 1 von 3                 │
│                                 │
└─────────────────────────────────┘
```

Bei falscher Antwort:

```
┌─────────────────────────────────┐
│                                 │
│   ❌ Leider falsch              │
│                                 │
│   Wort 4 ist "delta"            │
│                                 │
│   Bitte prüfe deine Notizen     │
│   und versuche es erneut.       │
│                                 │
│   [ Zurück zur Phrase ]         │
│                                 │
└─────────────────────────────────┘
```

### Erster Kontakt bestätigen

```
┌─────────────────────────────────┐
│                                 │
│   ✅ Deine ID wurde erstellt!   │
│                                 │
│   Jetzt noch Anna bestätigen:   │
│                                 │
│         📷 [Annas Bild]         │
│          Anna Müller            │
│                                 │
│   Ist das die Person, die       │
│   dir gerade gegenübersteht?    │
│                                 │
│   [ Ja, Identität bestätigen ]  │
│                                 │
│   [ Nein, abbrechen ]           │
│                                 │
└─────────────────────────────────┘
```

### QR-Code zeigen

```
┌─────────────────────────────────┐
│                                 │
│   Fast geschafft!               │
│                                 │
│   Zeig Anna diesen Code:        │
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │      ▄▄▄▄▄▄▄▄▄▄▄       │   │
│   │      █ QR-CODE █       │   │
│   │      █         █       │   │
│   │      ▀▀▀▀▀▀▀▀▀▀▀       │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   Ben Schmidt                   │
│   did:wot:b3n5chm1dt...        │
│                                 │
│   "Jetzt scannst du mich"       │
│                                 │
└─────────────────────────────────┘
```

### Willkommen im Netzwerk

```
┌─────────────────────────────────┐
│                                 │
│   🎉 Willkommen im Netzwerk!    │
│                                 │
│   Du bist jetzt verbunden mit:  │
│                                 │
│   👩 Anna Müller                │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Nächste Schritte:             │
│                                 │
│   📅 Annas Termine ansehen      │
│                                 │
│   🗺️  Orte in der Nähe          │
│                                 │
│   👥 Mehr Menschen treffen      │
│                                 │
│   [ Los geht's ]                │
│                                 │
└─────────────────────────────────┘
```

## Personas im Onboarding

### Greta (62) - braucht Hilfe

```mermaid
sequenceDiagram
    participant T as Tom - Nachbar hilft
    participant G as Greta - nicht technikaffin

    T->>G: Greta, ich zeig dir die neue Garten-App
    G->>T: Ich bin nicht so gut mit Technik...
    T->>G: Kein Problem, ich helfe dir durch
    
    T->>T: Zeigt QR-Code
    T->>G: Halt dein Handy hier drauf
    G->>G: Scannt mit Hilfe
    
    Note over G: App Store öffnet
    T->>G: Jetzt auf Installieren
    G->>G: Installiert
    
    Note over G: App öffnet
    T->>G: Siehst du mein Bild? Tipp auf Beitreten
    G->>G: Tippt
    
    Note over G: Name eingeben
    T->>G: Gib deinen Namen ein
    G->>G: Greta eingeben
    
    Note over G: Recovery-Phrase VERPFLICHTEND
    T->>G: Jetzt kommt das Wichtigste. Hast du Stift und Papier?
    G->>G: Holt Notizbuch
    T->>G: Diese 12 Wörter werden nur JETZT angezeigt
    G->>G: Schreibt auf
    T->>G: Prüf nochmal ob alles richtig ist
    T->>G: Gleich fragt die App 3 Wörter ab
    G->>G: Beantwortet Quiz mit Toms Hilfe
    T->>G: Bewahr das gut auf, getrennt vom Handy
    
    Note over T,G: Rest wie normaler Flow
```

### Familie Yilmaz - Straßenfest

```mermaid
sequenceDiagram
    participant K as Kemal - Organisator
    participant F as Familie Yilmaz

    Note over K,F: Straßenfest Info-Stand

    K->>F: Neu in der Gegend? Willkommen!
    F->>K: Ja, wir kennen noch niemanden
    K->>F: Wir haben eine App für Nachbarschaftshilfe
    
    K->>K: Zeigt QR-Code
    F->>F: Ein Familienmitglied scannt
    F->>F: Durchläuft Onboarding
    
    K->>K: Verifiziert Familie
    
    K->>F: Jetzt seht ihr wer was anbieten kann
    K->>F: Wenn ihr Hilfe braucht oder anbieten wollt...
    
    Note over F: Sieht sofort Gartengruppe und mehr
```

## Edge Cases

### Abbruch während Onboarding

```mermaid
flowchart TD
    Start(["Onboarding startet"]) --> Step1["App installiert"]
    Step1 --> Step2["Profil angelegt"]
    Step2 --> Step3["ID generiert"]
    Step3 --> Step4["Recovery-Phrase angezeigt"]
    Step4 --> Step5["Quiz bestanden"]
    Step5 --> Step6["Verifizierung"]
    
    Step1 -->|Abbruch| Cancel1["Kein Problem"]
    Step2 -->|Abbruch| Cancel2["Profil verworfen"]
    
    Step3 -->|Abbruch| Cancel3["KRITISCH - ID existiert aber Phrase nicht angezeigt"]
    
    Step4 -->|Abbruch| Cancel4["KRITISCH - Phrase angezeigt, Quiz nicht bestanden"]
    
    Step5 -->|Abbruch| Cancel5["ID und Backup bestätigt - OK"]
    Step6 -->|Abbruch| Cancel6["Status Pending - OK"]
    
    style Cancel3 fill:#FFB6C1
    style Cancel4 fill:#FFB6C1
```

**Wichtig:** 
- Nach Schritt 3 (ID generiert) blockiert die App das Schließen/Zurückgehen
- Der Nutzer MUSS das Quiz bestehen um fortzufahren
- Bei Abbruch während Phrase-Anzeige oder Quiz: App zeigt beim nächsten Start die Phrase erneut an und fordert Quiz-Abschluss

### Quiz nicht bestanden

Wenn der Nutzer eine falsche Antwort gibt:

1. Fehlermeldung mit korrekter Antwort
2. Zurück zur Phrase-Anzeige
3. Quiz startet von vorne mit neuen zufälligen Wort-Positionen

Es gibt **keine Möglichkeit**, das Quiz zu überspringen.
