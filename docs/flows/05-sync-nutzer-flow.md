# Sync-Flow (Nutzer-Perspektive)

> Wie Daten zwischen Geräten synchronisiert werden

## Grundprinzip

Das Web of Trust funktioniert **offline-first**: Du kannst die App jederzeit nutzen, auch ohne Internet. Sobald eine Verbindung besteht, werden Änderungen automatisch synchronisiert.

```mermaid
flowchart LR
    subgraph Offline["Offline"]
        Create["Content erstellen"]
        Verify["Verifizieren"]
        Attest["Attestieren"]
    end

    subgraph Queue["Warteschlange"]
        Pending["Ausstehende Änderungen"]
    end

    subgraph Online["Online"]
        Sync["Automatische Synchronisation"]
    end

    Create --> Pending
    Verify --> Pending
    Attest --> Pending

    Pending -->|Internet verfügbar| Sync
```

---

## Was der Nutzer sieht

### Sync-Status in der App

```
┌─────────────────────────────────┐
│  ☁️ Synchronisation             │
├─────────────────────────────────┤
│                                 │
│  Status: ✅ Synchronisiert      │
│                                 │
│  Letzte Sync: vor 2 Minuten     │
│                                 │
│  Ausstehend: 0 Änderungen       │
│                                 │
└─────────────────────────────────┘
```

### Offline-Modus

```
┌─────────────────────────────────┐
│  📴 Offline                     │
├─────────────────────────────────┤
│                                 │
│  Du bist offline.               │
│  Die App funktioniert normal.   │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  Ausstehende Änderungen: 3      │
│                                 │
│  • 1 Kalender-Eintrag           │
│  • 1 Verifizierung              │
│  • 1 Attestation                │
│                                 │
│  Wird synchronisiert sobald     │
│  du wieder online bist.         │
│                                 │
└─────────────────────────────────┘
```

### Sync läuft

```
┌─────────────────────────────────┐
│  🔄 Synchronisiere...           │
├─────────────────────────────────┤
│                                 │
│  ████████████░░░░░░░ 60%        │
│                                 │
│  Sende: 3 Änderungen            │
│  Empfange: 12 neue Einträge     │
│                                 │
└─────────────────────────────────┘
```

### Sync-Konflikt

```
┌─────────────────────────────────┐
│  ⚠️ Konflikt                    │
├─────────────────────────────────┤
│                                 │
│  Der Termin "Gartentreffen"     │
│  wurde von dir und Anna         │
│  gleichzeitig bearbeitet.       │
│                                 │
│  Deine Version:                 │
│  "Sa, 15.01. 14:00"             │
│                                 │
│  Annas Version:                 │
│  "Sa, 15.01. 15:00"             │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Meine behalten ]             │
│                                 │
│  [ Annas übernehmen ]           │
│                                 │
│  [ Beide behalten ]             │
│                                 │
└─────────────────────────────────┘
```

---

## Hauptflow: Automatische Synchronisation

```mermaid
sequenceDiagram
    participant U as Nutzer
    participant App as App
    participant Server as Sync Server

    Note over App: App im Hintergrund

    App->>App: Prüfe Verbindung
    App->>App: Änderungen in Warteschlange?

    alt Änderungen vorhanden
        App->>Server: Sende lokale Änderungen
        Server->>App: Bestätigung
    end

    App->>Server: Frage nach neuen Daten
    Server->>App: Neue Daten seit letztem Sync

    App->>App: Verarbeite neue Daten
    App->>App: Aktualisiere lokale Datenbank

    alt Konflikte
        App->>U: Zeige Konflikt-Dialog
        U->>App: Wählt Lösung
    end

    Note over App: Sync abgeschlossen
```

---

## Offline-Nutzung

### Was offline funktioniert

| Aktion | Offline möglich? |
| ------ | ---------------- |
| Content ansehen | ✅ Ja (lokal gespeichert) |
| Content erstellen | ✅ Ja (wird später synchronisiert) |
| Content bearbeiten | ✅ Ja |
| Verifizierung per QR | ✅ Ja (lokal gespeichert) |
| Attestation erstellen | ✅ Ja |
| Neue Kontakte sehen | ❌ Nein (noch nicht synchronisiert) |
| Profil-Updates sehen | ❌ Nein |

### Offline-Verifizierung

```mermaid
sequenceDiagram
    participant A as Anna
    participant B as Ben
    participant Server as Server

    Note over A,B: Beide offline beim Treffen

    A->>A: Zeigt QR-Code
    B->>A: Scannt QR
    B->>B: Speichert Verifizierung lokal

    B->>B: Zeigt QR-Code
    A->>B: Scannt QR
    A->>A: Speichert Verifizierung lokal

    Note over A,B: Später online

    A->>Server: Sync Verifizierung
    B->>Server: Sync Verifizierung

    Server->>A: Bens Verifizierung empfangen
    Server->>B: Annas Verifizierung empfangen

    Note over A,B: Beide Seiten vollständig
```

---

## Personas

### Greta im Garten (schlechter Empfang)

```mermaid
sequenceDiagram
    participant G as Greta
    participant App as App

    Note over G: Im Garten, kein Empfang

    G->>App: Erstellt Termin "Gießen morgen"
    App->>App: Speichert lokal
    App->>G: Termin erstellt!

    Note over App: Status: 1 Änderung ausstehend

    G->>App: Erstellt Attestation für Tom
    App->>App: Speichert lokal
    App->>G: Attestation erstellt!

    Note over App: Status: 2 Änderungen ausstehend

    Note over G: Geht nach Hause (WLAN)

    App->>App: Verbindung erkannt
    App->>App: Automatischer Sync

    App->>G: Synchronisiert!
```

### Familie Yilmaz auf dem Straßenfest

```mermaid
sequenceDiagram
    participant Y as Familie Yilmaz
    participant K as Kemal
    participant App as Apps

    Note over Y,K: Straßenfest, instabiles WLAN

    K->>K: Zeigt QR-Code
    Y->>K: Scannt QR (offline gespeichert)
    Y->>Y: Zeigt QR-Code
    K->>Y: Scannt QR (offline gespeichert)

    Note over Y,K: Beide haben lokale Kopien

    Note over Y: Später zu Hause

    Y->>App: App synchronisiert automatisch
    App->>Y: Kemals Profil vollständig geladen

    Note over K: Ebenfalls später

    K->>App: App synchronisiert
    App->>K: Yilmaz-Familie vollständig sichtbar
```

---

## Konflikte

### Wann entstehen Konflikte?

```mermaid
flowchart TD
    A(["Anna bearbeitet Termin offline"]) --> AV["Version 2a"]
    B(["Ben bearbeitet gleichen Termin offline"]) --> BV["Version 2b"]

    AV --> Sync["Beide synchronisieren"]
    BV --> Sync

    Sync --> Conflict["Konflikt: 2 Versionen mit gleicher Basis"]
```

### Automatische Konfliktauflösung

Die meisten Konflikte werden automatisch gelöst:

| Situation | Lösung |
| --------- | ------ |
| Gleiches Feld, gleicher Wert | Kein Konflikt |
| Verschiedene Felder geändert | Beide Änderungen übernehmen |
| Neuere Version überschreibt | Last-Write-Wins |

### Manuelle Konfliktauflösung

Bei echten Konflikten (gleiches Feld, verschiedene Werte) wird der Nutzer gefragt:

```
┌─────────────────────────────────┐
│                                 │
│  Welche Version behalten?       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Deine Version           │    │
│  │ Bearbeitet: vor 10 Min  │    │
│  │ "Treffpunkt: Parkplatz" │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Annas Version           │    │
│  │ Bearbeitet: vor 5 Min   │    │
│  │ "Treffpunkt: Eingang"   │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Einstellungen

### Sync-Einstellungen

```
┌─────────────────────────────────┐
│  ⚙️ Synchronisation             │
├─────────────────────────────────┤
│                                 │
│  Automatisch synchronisieren    │
│  [===========○] An              │
│                                 │
│  Nur über WLAN                  │
│  [○===========] Aus             │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Jetzt synchronisieren ]      │
│                                 │
│  Letzte Sync: vor 5 Minuten     │
│                                 │
└─────────────────────────────────┘
```

---

## Multi-Device

### Gleiche Identität auf mehreren Geräten

```mermaid
flowchart TD
    ID(["Annas Identität"]) --> Phone["Handy"]
    ID --> Tablet["Tablet"]
    ID --> Web["Browser"]

    Phone --> Server["Sync Server"]
    Tablet --> Server
    Web --> Server

    Server --> Sync["Alle Geräte synchronisiert"]
```

### Neues Gerät hinzufügen

```
┌─────────────────────────────────┐
│                                 │
│  📱 Neues Gerät                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Um deine Identität auf         │
│  diesem Gerät zu nutzen,        │
│  gib deine Recovery-Phrase      │
│  ein.                           │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 1. apple                │    │
│  │ 2. banana               │    │
│  │ 3. cherry               │    │
│  │ ...                     │    │
│  └─────────────────────────┘    │
│                                 │
│  [ Wiederherstellen ]           │
│                                 │
└─────────────────────────────────┘
```

---

## Datenvolumen

### Was wird synchronisiert?

| Daten | Größe (typisch) |
| ----- | --------------- |
| Profil | 1-5 KB |
| Verifizierung | < 1 KB |
| Attestation | 1-2 KB |
| Kalender-Eintrag | 1-3 KB |
| Karten-Markierung | 1-2 KB |
| Foto (komprimiert) | 50-200 KB |

### Typisches Datenvolumen

| Szenario | Monatlich |
| -------- | --------- |
| Wenig aktiv (10 Kontakte) | 1-5 MB |
| Aktiv (50 Kontakte) | 10-30 MB |
| Sehr aktiv (100+ Kontakte) | 50-100 MB |

---

## Fehlerbehebung

### Sync funktioniert nicht

```
┌─────────────────────────────────┐
│  ❌ Sync fehlgeschlagen         │
├─────────────────────────────────┤
│                                 │
│  Mögliche Ursachen:             │
│                                 │
│  • Keine Internetverbindung     │
│  • Server nicht erreichbar      │
│  • App-Update erforderlich      │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Erneut versuchen ]           │
│                                 │
│  [ Offline weiterarbeiten ]     │
│                                 │
└─────────────────────────────────┘
```

### Daten zurücksetzen

Falls die lokale Datenbank korrupt ist:

```
┌─────────────────────────────────┐
│  🔄 Daten neu laden             │
├─────────────────────────────────┤
│                                 │
│  ⚠️ Alle lokalen Daten werden   │
│  gelöscht und vom Server neu    │
│  geladen.                       │
│                                 │
│  Deine Identität bleibt         │
│  erhalten.                      │
│                                 │
│  [ Abbrechen ]                  │
│                                 │
│  [ Daten neu laden ]            │
│                                 │
└─────────────────────────────────┘
```
