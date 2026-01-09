# Recovery-Flow (Nutzer-Perspektive)

> Wie eine Identität wiederhergestellt wird

## Wann brauche ich Recovery?

| Situation | Recovery nötig? |
| --------- | --------------- |
| Gerät verloren | Ja |
| Gerät gestohlen | Ja |
| App gelöscht | Ja |
| Browserdaten gelöscht (Web) | Ja |
| Neues Gerät | Ja (oder Multi-Device Setup) |
| App-Update | Nein |
| Passwort vergessen | Es gibt kein Passwort |

---

## Voraussetzung: Recovery-Phrase

Die Recovery-Phrase ist der **einzige Weg**, deine Identität wiederherzustellen.

```
┌─────────────────────────────────┐
│                                 │
│  ⚠️  WICHTIG                    │
│                                 │
│  Deine Recovery-Phrase wurde    │
│  dir EINMALIG bei der ID-       │
│  Erstellung angezeigt.          │
│                                 │
│  Sie kann NICHT erneut          │
│  abgerufen werden.              │
│                                 │
│  Ohne sie ist deine Identität   │
│  VERLOREN.                      │
│                                 │
└─────────────────────────────────┘
```

---

## Hauptflow: Identität wiederherstellen

```mermaid
sequenceDiagram
    participant U as Nutzer
    participant App as Neue App
    participant Server as Server

    Note over U: Neues Gerät / App neu installiert

    U->>App: Öffnet App
    App->>U: Willkommen! Neu hier oder wiederherstellen?

    U->>App: Tippt "Wiederherstellen"

    App->>U: Recovery-Phrase eingeben

    U->>App: Gibt 12 Wörter ein

    App->>App: Validiert Wörter (BIP39)
    App->>App: Generiert Schlüssel aus Phrase
    App->>App: Berechnet DID

    App->>Server: Frage nach Daten für DID
    Server->>App: Verschlüsselte Daten

    App->>App: Entschlüsselt mit Private Key

    App->>U: Willkommen zurück!
```

---

## Was der Nutzer sieht

### Startbildschirm (neue Installation)

```
┌─────────────────────────────────┐
│                                 │
│      🌐 Web of Trust            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  🆕 Neu hier?            │    │
│  │                         │    │
│  │  Erstelle eine neue     │    │
│  │  Identität              │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  🔄 Wiederherstellen     │    │
│  │                         │    │
│  │  Ich habe bereits       │    │
│  │  eine Identität         │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Recovery-Phrase eingeben

```
┌─────────────────────────────────┐
│                                 │
│  🔄 Identität wiederherstellen  │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Gib deine 12 Wörter ein:       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 1. apple                │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 2. banana               │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 3. cherry               │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 4.                      │    │
│  └─────────────────────────┘    │
│        ...                      │
│  ┌─────────────────────────┐    │
│  │ 12.                     │    │
│  └─────────────────────────┘    │
│                                 │
│  [ Wiederherstellen ]           │
│                                 │
└─────────────────────────────────┘
```

### Wiederherstellung läuft

```
┌─────────────────────────────────┐
│                                 │
│  🔄 Stelle wieder her...        │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ████████████░░░░░░░ 60%        │
│                                 │
│  ✅ Schlüssel generiert         │
│  ✅ Identität gefunden          │
│  🔄 Lade Daten...               │
│  ⬜ Kontakte laden              │
│  ⬜ Content laden               │
│                                 │
└─────────────────────────────────┘
```

### Wiederherstellung erfolgreich

```
┌─────────────────────────────────┐
│                                 │
│  ✅ Willkommen zurück!          │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Deine Identität wurde          │
│  wiederhergestellt:             │
│                                 │
│         📷 [Profilbild]         │
│          Anna Müller            │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  Wiederhergestellt:             │
│                                 │
│  👥 23 Kontakte                 │
│  📜 47 Attestationen            │
│  📅 12 Kalender-Einträge        │
│  📍 8 Karten-Markierungen       │
│                                 │
│  [ Los geht's ]                 │
│                                 │
└─────────────────────────────────┘
```

---

## Fehlerfall: Falsche Phrase

```
┌─────────────────────────────────┐
│                                 │
│  ❌ Ungültige Phrase            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Die eingegebene Recovery-      │
│  Phrase ist ungültig.           │
│                                 │
│  Mögliche Ursachen:             │
│                                 │
│  • Wort falsch geschrieben      │
│  • Wörter in falscher           │
│    Reihenfolge                  │
│  • Falsches Wort verwendet      │
│                                 │
│  Bitte prüfe deine Notizen      │
│  und versuche es erneut.        │
│                                 │
│  [ Erneut versuchen ]           │
│                                 │
└─────────────────────────────────┘
```

---

## Fehlerfall: Keine Recovery-Phrase

```mermaid
flowchart TD
    Lost(["Gerät verloren"]) --> HasPhrase{"Recovery-Phrase vorhanden?"}

    HasPhrase -->|Ja| Recover["Wiederherstellen"]
    Recover --> Success["Alles wiederhergestellt"]

    HasPhrase -->|Nein| Gone["Identität verloren"]
    Gone --> NewID["Neue Identität erstellen"]
    NewID --> Reverify["Alle Kontakte müssen dich neu verifizieren"]
    NewID --> LostAttestations["Alte Attestationen verloren"]

    style Gone fill:#FF6B6B
    style LostAttestations fill:#FF6B6B
```

### Was verloren ist

```
┌─────────────────────────────────┐
│                                 │
│  😔 Ohne Recovery-Phrase        │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Leider können wir deine        │
│  Identität nicht wiederherstellen.│
│                                 │
│  Was verloren ist:              │
│                                 │
│  ❌ Deine Identität (DID)       │
│  ❌ Alle Verifizierungen        │
│  ❌ Alle erhaltenen Attestationen│
│  ❌ Dein Profil                 │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  Du kannst eine neue Identität  │
│  erstellen, aber du musst:      │
│                                 │
│  • Alle Kontakte neu treffen    │
│  • Neue Attestationen sammeln   │
│                                 │
│  [ Neue Identität erstellen ]   │
│                                 │
└─────────────────────────────────┘
```

---

## Personas

### Greta verliert ihr Handy



```mermaid
sequenceDiagram
    participant G as Greta
    participant T as Tom (Nachbar)
    participant App as Neue App

    Note over G: Handy gestohlen

        Note over G,T: Tom hilft Greta beim Backup


    G->>G: Holt Notizbuch mit Phrase

    G->>App: Installiert App auf neuem Handy

    G->>App: Tippt "Wiederherstellen"

    G->>App: Gibt 12 Wörter ein (mit Lesebrille)

    App->>G: Willkommen zurück, Greta!

    Note over G: Alle Daten sind wieder da
```

### Lena (Skeptikerin) testet Recovery

```mermaid
sequenceDiagram
    participant L as Lena
    participant Phone as Handy
    participant Web as Browser

    Note over L: Testet das System

    L->>Phone: Erstellt Identität

    L->>L: Notiert Recovery-Phrase

    L->>Web: Öffnet Web-App
    L->>Web: Gibt Recovery-Phrase ein

    Web->>L: Identität wiederhergestellt

    Note over L: Gleiche Identität auf beiden Geräten
    Note over L: System funktioniert wie dokumentiert
```

### Familie Yilmaz ohne Phrase

```mermaid
sequenceDiagram
    participant Y as Familie Yilmaz
    participant App as App

    Note over Y: Handy kaputt, Phrase nicht notiert

    Y->>App: Versucht Wiederherstellung

    App->>Y: Recovery-Phrase eingeben

    Y->>Y: Phrase nicht aufgeschrieben...

    App->>Y: Ohne Phrase keine Wiederherstellung

    Note over Y: Muss neue Identität erstellen
    Note over Y: Muss alle Kontakte neu treffen
```

---

## Recovery auf verschiedenen Plattformen

### iOS / Android

```
┌─────────────────────────────────┐
│                                 │
│  Nach Wiederherstellung:        │
│                                 │
│  ✅ Private Key im Keychain/    │
│     Keystore gespeichert        │
│                                 │
│  ✅ Alle Daten vom Server       │
│     geladen                     │
│                                 │
│  ✅ Push-Benachrichtigungen     │
│     aktiviert                   │
│                                 │
└─────────────────────────────────┘
```

### Web (Browser)

```
┌─────────────────────────────────┐
│                                 │
│  ⚠️ Web-Hinweis                 │
│                                 │
│  Im Browser wird dein           │
│  Schlüssel durch die Web        │
│  Crypto API geschützt und       │
│  kann nicht ausgelesen werden.  │
│                                 │
│  ACHTUNG: Wenn du "Browser-     │
│  daten löschen" verwendest,     │
│  musst du erneut mit der        │
│  Recovery-Phrase wiederherstellen.│
│                                 │
│  [ Verstanden ]                 │
│                                 │
└─────────────────────────────────┘
```

---

## Was passiert mit laufenden Prozessen?

### Ausstehende Verifizierungen

```mermaid
flowchart TD
    Before(["Vor dem Verlust"]) --> Pending["Pending Verifizierung mit Ben"]

    Pending --> Lost["Gerät verloren"]

    Lost --> Recover["Recovery auf neuem Gerät"]

    Recover --> Status{"Pending-Status?"}

    Status --> StillPending["Immer noch pending"]
    StillPending --> Continue["Ben kann dich jetzt verifizieren"]
```

**Ergebnis:** Pending-Verifizierungen bleiben erhalten. Der andere kann dich weiterhin verifizieren.

### Unveröffentlichte Änderungen

```mermaid
flowchart TD
    Before(["Vor dem Verlust"]) --> Unsaved["3 Änderungen nicht synchronisiert"]

    Unsaved --> Lost["Gerät verloren"]

    Lost --> Recover["Recovery"]

    Recover --> OnlyServer["Nur Server-Daten verfügbar"]

    OnlyServer --> Missing["Unsynchronisierte Änderungen verloren"]

    style Missing fill:#FFE4B5
```

**Ergebnis:** Änderungen, die nicht synchronisiert wurden, sind verloren.

---

## Sicherheitshinweise

### Phrase sicher aufbewahren

```
┌─────────────────────────────────┐
│                                 │
│  📝 Empfehlungen                │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ✅ Auf Papier aufschreiben     │
│                                 │
│  ✅ An sicherem Ort aufbewahren │
│     (nicht im Handy!)           │
│                                 │
│  ✅ Eventuell zweite Kopie an   │
│     anderem Ort                 │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  ❌ Nicht digital speichern     │
│     (Fotos, Notiz-Apps, Cloud)  │
│                                 │
│  ❌ Nicht per Email/Chat senden │
│                                 │
│  ❌ Keinen Screenshot machen    │
│                                 │
└─────────────────────────────────┘
```

### Bei Verdacht auf Kompromittierung

```
┌─────────────────────────────────┐
│                                 │
│  ⚠️ Phrase kompromittiert?      │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Wenn du glaubst, dass jemand   │
│  deine Phrase kennt:            │
│                                 │
│  1. Erstelle eine NEUE Identität│
│                                 │
│  2. Informiere deine Kontakte   │
│                                 │
│  3. Lass dich neu verifizieren  │
│                                 │
│  Die alte Identität sollte      │
│  nicht mehr verwendet werden.   │
│                                 │
└─────────────────────────────────┘
```

---

## FAQ

**Kann ich meine Phrase ändern?**
Nein. Die Phrase ist fest mit deiner Identität verbunden. Eine neue Phrase bedeutet eine neue Identität.

**Was wenn ich ein Wort falsch notiert habe?**
Die App prüft, ob alle Wörter gültig sind (BIP39-Wortliste). Wenn ein Wort falsch ist, wird die Phrase nicht akzeptiert.

**Kann der Support mir helfen?**
Nein. Niemand außer dir kennt deine Phrase. Das ist Absicht - so kann sie auch niemand stehlen.

**Kann ich die Phrase nachträglich anzeigen lassen?**
Nein. Die Phrase wird nur einmal bei der ID-Erstellung angezeigt und danach nirgendwo gespeichert.
