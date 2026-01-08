# Export-Flow (Nutzer-Perspektive)

> Wie Daten exportiert werden

## Warum Export?

Das Web of Trust ist **kein Vendor-Lock-in**. Deine Daten gehören dir.

```
┌─────────────────────────────────┐
│                                 │
│  💡 Deine Daten, dein Recht     │
│                                 │
│  Du kannst jederzeit alle       │
│  deine Daten exportieren:       │
│                                 │
│  • Für Backups                  │
│  • Zur Archivierung             │
│  • Für andere Tools             │
│  • Aus reiner Neugier           │
│                                 │
└─────────────────────────────────┘
```

---

## Hauptflow: Daten exportieren

```mermaid
sequenceDiagram
    participant U as Nutzer
    participant App as App
    participant FS as Dateisystem

    U->>App: Einstellungen öffnen
    U->>App: Export wählen

    App->>U: Was möchtest du exportieren?

    U->>App: Auswahl treffen

    App->>U: Format wählen

    U->>App: Format auswählen

    App->>App: Daten sammeln
    App->>App: In gewähltes Format konvertieren

    App->>FS: Datei speichern

    App->>U: Export abgeschlossen!
```

---

## Was der Nutzer sieht

### Export starten

```
┌─────────────────────────────────┐
│  ⚙️ Einstellungen               │
├─────────────────────────────────┤
│                                 │
│  Daten & Speicher               │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📤 Daten exportieren    │    │
│  │    Alle deine Daten als │    │
│  │    Datei herunterladen  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🗑️ Daten löschen        │    │
│  │    Alle lokalen Daten   │    │
│  │    entfernen            │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Export-Auswahl

```
┌─────────────────────────────────┐
│                                 │
│  📤 Daten exportieren           │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Was möchtest du exportieren?   │
│                                 │
│  [✓] Profil                     │
│      Name, Foto, Bio            │
│                                 │
│  [✓] Kontakte                   │
│      23 Kontakte                │
│                                 │
│  [✓] Verifizierungen            │
│      23 Verifizierungen         │
│                                 │
│  [✓] Attestationen              │
│      47 erhalten, 12 gegeben    │
│                                 │
│  [✓] Content                    │
│      34 Einträge                │
│                                 │
│  [ ] Gruppen                    │
│      3 Gruppen                  │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Alles auswählen ]            │
│                                 │
│  [ Weiter ]                     │
│                                 │
└─────────────────────────────────┘
```

### Format wählen

```
┌─────────────────────────────────┐
│                                 │
│  📤 Export-Format               │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Wähle ein Format:              │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📋 JSON                 │    │
│  │    Maschinenlesbar,     │    │
│  │    für Entwickler       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📊 CSV                  │    │
│  │    Für Excel/Tabellen   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📄 PDF                  │    │
│  │    Lesbares Dokument    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📦 ZIP (alle Formate)   │    │
│  │    Komplettes Archiv    │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Export läuft

```
┌─────────────────────────────────┐
│                                 │
│  📤 Exportiere...               │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ████████████░░░░░░░ 60%        │
│                                 │
│  ✅ Profil                      │
│  ✅ Kontakte                    │
│  ✅ Verifizierungen             │
│  🔄 Attestationen...            │
│  ⬜ Content                     │
│                                 │
└─────────────────────────────────┘
```

### Export abgeschlossen

```
┌─────────────────────────────────┐
│                                 │
│  ✅ Export abgeschlossen!       │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Datei: wot-export-2025-01-08.zip│
│  Größe: 2.3 MB                  │
│                                 │
│  Enthält:                       │
│  • 1 Profil                     │
│  • 23 Kontakte                  │
│  • 23 Verifizierungen           │
│  • 59 Attestationen             │
│  • 34 Content-Einträge          │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Teilen ]                     │
│                                 │
│  [ In Dateien öffnen ]          │
│                                 │
│  [ Fertig ]                     │
│                                 │
└─────────────────────────────────┘
```

---

## Was ist im Export enthalten?

### Profil

```
┌─────────────────────────────────┐
│  👤 Mein Profil                 │
├─────────────────────────────────┤
│                                 │
│  Name: Anna Müller              │
│  DID: did:wot:anna123...        │
│  Bio: Aktiv im Gemeinschafts-   │
│       garten Sonnenberg         │
│                                 │
│  Erstellt: 01.01.2025           │
│  Foto: [enthalten]              │
│                                 │
└─────────────────────────────────┘
```

### Kontakte

```
┌─────────────────────────────────┐
│  👥 Kontakte (23)               │
├─────────────────────────────────┤
│                                 │
│  1. Ben Schmidt                 │
│     DID: did:wot:ben456...      │
│     Status: aktiv               │
│     Verifiziert: 05.01.2025     │
│                                 │
│  2. Carla Braun                 │
│     DID: did:wot:carla789...    │
│     Status: aktiv               │
│     Verifiziert: 03.01.2025     │
│                                 │
│  ...                            │
│                                 │
└─────────────────────────────────┘
```

### Attestationen

```
┌─────────────────────────────────┐
│  📜 Attestationen               │
├─────────────────────────────────┤
│                                 │
│  ERHALTEN (47):                 │
│                                 │
│  "Hat 3 Stunden im Garten       │
│   geholfen"                     │
│  Von: Tom Wagner                │
│  Datum: 08.01.2025              │
│  Tags: Garten, Helfen           │
│                                 │
│  ...                            │
│                                 │
│  GEGEBEN (12):                  │
│                                 │
│  "Kennt sich super mit          │
│   Fahrrädern aus"               │
│  An: Ben Schmidt                │
│  Datum: 06.01.2025              │
│  Tags: Handwerk, Fahrrad        │
│                                 │
│  ...                            │
│                                 │
└─────────────────────────────────┘
```

---

## Export-Formate

### JSON

Maschinenlesbares Format mit vollständiger Struktur:

```json
{
  "exportVersion": "1.0",
  "exportedAt": "2025-01-08T15:00:00Z",
  "profile": {
    "did": "did:wot:anna123",
    "name": "Anna Müller",
    "bio": "..."
  },
  "contacts": [...],
  "verifications": [...],
  "attestations": [...],
  "items": [...]
}
```

### CSV

Tabellenformat, eine Datei pro Typ:

```
contacts.csv:
Name,DID,Status,Verifiziert am
Ben Schmidt,did:wot:ben456,aktiv,2025-01-05
Carla Braun,did:wot:carla789,aktiv,2025-01-03

attestations.csv:
Von,An,Text,Tags,Datum
Tom Wagner,Anna Müller,"Hat geholfen","Garten,Helfen",2025-01-08
```

### PDF

Lesbares Dokument mit formatierter Übersicht:

```
┌─────────────────────────────────┐
│                                 │
│  WEB OF TRUST EXPORT            │
│  Anna Müller                    │
│  08.01.2025                     │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  PROFIL                         │
│  ...                            │
│                                 │
│  KONTAKTE                       │
│  ...                            │
│                                 │
│  ATTESTATIONEN                  │
│  ...                            │
│                                 │
└─────────────────────────────────┘
```

### ZIP (Komplett-Archiv)

```
wot-export-2025-01-08.zip
├── profile.json
├── contacts.json
├── contacts.csv
├── verifications.json
├── attestations.json
├── attestations.csv
├── items.json
├── items.csv
├── media/
│   ├── profile-photo.jpg
│   └── ...
└── summary.pdf
```

---

## Personas

### Lena (Skeptikerin) prüft ihre Daten

```mermaid
sequenceDiagram
    participant L as Lena
    participant App as App

    Note over L: Will wissen was gespeichert wird

    L->>App: Einstellungen → Export
    L->>App: Alles auswählen
    L->>App: Format: JSON

    App->>L: Export-Datei

    L->>L: Öffnet in Code-Editor
    L->>L: Prüft Struktur
    L->>L: Sucht nach versteckten Daten

    Note over L: Findet nur das erwartete - gut!
```

### Greta macht Backup

```mermaid
sequenceDiagram
    participant G as Greta
    participant T as Tom (Nachbar)
    participant App as App

    Note over G,T: Tom hilft Greta beim Backup

    T->>G: Lass uns deine Daten sichern
    G->>App: Einstellungen → Export

    T->>G: Wähle "Alles" und "ZIP"

    App->>G: Export-Datei

    T->>G: Speicher das auf deinem Computer
    T->>G: Zusätzlich zur Recovery-Phrase
```

### Kemal archiviert Reparatur-Café

```mermaid
sequenceDiagram
    participant K as Kemal
    participant App as App

    Note over K: Will Jahresrückblick erstellen

    K->>App: Export → Attestationen
    K->>App: Format: CSV

    App->>K: attestations.csv

    K->>K: Öffnet in Excel
    K->>K: Filtert nach "Reparatur"
    K->>K: Erstellt Statistik

    Note over K: 127 Reparaturen in 2024!
```

---

## Was ist NICHT im Export?

| Nicht enthalten | Warum |
| --------------- | ----- |
| Private Key | Sicherheitsrisiko |
| Recovery-Phrase | Sicherheitsrisiko |
| Verschlüsselte Blobs | Nicht nützlich ohne Key |
| Content anderer | Nur deine eigenen Daten |
| Gruppen-Keys | Sicherheitsrisiko |

---

## FAQ

**Kann ich den Export woanders importieren?**
Das hängt vom Zielsystem ab. Das JSON-Format ist standardisiert und kann von anderen Tools verarbeitet werden.

**Enthält der Export sensible Daten?**
Ja - er enthält deine Kontakte, Attestationen und Inhalte. Behandle die Export-Datei vertraulich.

**Wie oft sollte ich exportieren?**
Für Backups: Regelmäßig, z.B. monatlich. Die Recovery-Phrase ist wichtiger als der Export.

**Kann ich gelöschte Daten exportieren?**
Nein. Der Export enthält nur aktuelle Daten.

**Ist der Export verschlüsselt?**
Nein. Der Export ist im Klartext. Wenn du ihn sicher aufbewahren willst, verschlüssele die Datei selbst.
