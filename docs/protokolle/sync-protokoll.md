# Sync-Protokoll

> Offline-First Synchronisation im Web of Trust

## Grundprinzip: Offline-First

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Offline-First bedeutet:                                    │
│                                                             │
│  1. Alle Daten lokal gespeichert                            │
│  2. Alle Operationen funktionieren offline                  │
│  3. Sync passiert im Hintergrund wenn online                │
│  4. Konflikte werden automatisch aufgelöst                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Architektur

```mermaid
flowchart TD
    subgraph Device1["Gerät A"]
        LA[Lokale DB]
        QA[Sync Queue]
    end

    subgraph Device2["Gerät B"]
        LB[Lokale DB]
        QB[Sync Queue]
    end

    subgraph Server["Sync Server"]
        Store[Encrypted Store]
        Notify[Push Notifications]
    end

    LA <-->|CRDT Merge| QA
    QA <-->|Sync| Store
    Store <-->|Sync| QB
    QB <-->|CRDT Merge| LB

    Store --> Notify
    Notify -.->|"Neue Daten"| Device1
    Notify -.->|"Neue Daten"| Device2
```

---

## CRDT-basierter Ansatz

### Was sind CRDTs?

**C**onflict-free **R**eplicated **D**ata **T**ypes - Datenstrukturen, die automatisch und deterministisch zusammengeführt werden können.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Beispiel: Last-Writer-Wins Register                        │
│                                                             │
│  Gerät A (offline):  name = "Anna" @ timestamp 10:00        │
│  Gerät B (offline):  name = "Anna M." @ timestamp 10:05     │
│                                                             │
│  Nach Sync:                                                 │
│  Beide Geräte:       name = "Anna M." (späterer Timestamp)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CRDT-Typen im System

| Datentyp | CRDT-Strategie |
|----------|----------------|
| Profil-Felder | LWW-Register (Last Writer Wins) |
| Kontakt-Liste | LWW-Map + Tombstones |
| Items | LWW-Register + Soft Delete |
| Attestationen | Add-only Set (unveränderlich) |
| Verifizierungen | Add-only Set (unveränderlich) |
| Gruppen-Membership | LWW-Map |

---

## Sync-Ablauf

### 1. Lokale Änderung

```mermaid
sequenceDiagram
    participant U as User
    participant App as App
    participant DB as Local DB
    participant Q as Sync Queue

    U->>App: Erstellt Item
    App->>DB: Speichern (mit Timestamp + DeviceID)
    App->>Q: In Queue einfügen
    App->>U: Sofort sichtbar

    Note over Q: Wartet auf Verbindung
```

### 2. Push zum Server

```mermaid
sequenceDiagram
    participant Q as Sync Queue
    participant App as App
    participant Server as Server

    Note over App: Online

    Q->>App: Pending Changes
    App->>Server: Push encrypted changes

    alt Erfolg
        Server->>App: ACK
        App->>Q: Als synced markieren
    else Konflikt
        Server->>App: Conflict + Remote State
        App->>App: CRDT Merge
        App->>Server: Retry mit merged state
    end
```

### 3. Pull vom Server

```mermaid
sequenceDiagram
    participant Server as Server
    participant App as App
    participant DB as Local DB

    Server->>App: Push Notification (neue Daten)
    App->>Server: Pull changes since lastSync

    Server->>App: Encrypted changes

    App->>App: Entschlüsseln
    App->>App: CRDT Merge mit lokalem State
    App->>DB: Merged State speichern

    App->>App: UI aktualisieren
```

---

## Konfliktauflösung

### Strategie: Deterministische Merge-Regeln

```mermaid
flowchart TD
    C[Konflikt erkannt] --> T{Datentyp?}

    T -->|Immutable| I[Kein Konflikt möglich]
    T -->|LWW| L[Späterer Timestamp gewinnt]
    T -->|Delete| D[Delete gewinnt bei gleichem Timestamp]

    I --> M[Merged State]
    L --> M
    D --> M
```

### Beispiele

#### Profil-Änderung (LWW)

```
Gerät A: { name: "Anna", updatedAt: "10:00" }
Gerät B: { name: "Anna Müller", updatedAt: "10:05" }

Merge: { name: "Anna Müller", updatedAt: "10:05" }
```

#### Item löschen vs. bearbeiten

```
Gerät A: Item bearbeiten @ 10:00
Gerät B: Item löschen @ 10:00

Merge: Item gelöscht (Delete hat Priorität bei gleichem Timestamp)
```

#### Kontakt-Status

```
Gerät A: Kontakt ausblenden @ 10:00
Gerät B: (keine Änderung)

Merge: Kontakt ausgeblendet
```

---

## Server-Rolle

### Was der Server tut

| Aufgabe | Beschreibung |
|---------|--------------|
| **Speichern** | Verschlüsselte Daten persistent halten |
| **Verteilen** | Änderungen an andere Geräte/Nutzer weiterleiten |
| **Benachrichtigen** | Push Notifications bei neuen Daten |
| **Versionieren** | Vector Clocks / Sync Cursors verwalten |

### Was der Server NICHT tut

| Nicht | Warum |
|-------|-------|
| **Entschlüsseln** | Kein Zugriff auf Private Keys |
| **Konfliktauflösung** | Clients machen das deterministisch |
| **Autorisierung prüfen** | Kryptografisch durch Signaturen gesichert |
| **Inhalte verstehen** | Alles E2E-verschlüsselt |

---

## Sync-Cursor und Versionierung

### Vector Clocks

Jedes Gerät hat einen Zähler pro bekanntem Gerät:

```json
{
  "deviceA": 42,
  "deviceB": 17,
  "deviceC": 8
}
```

### Sync Request

```json
{
  "lastSeen": {
    "deviceA": 40,
    "deviceB": 17
  },
  "changes": [
    {
      "type": "item",
      "id": "urn:uuid:...",
      "data": "encrypted...",
      "clock": { "deviceA": 41 }
    },
    {
      "type": "item",
      "id": "urn:uuid:...",
      "data": "encrypted...",
      "clock": { "deviceA": 42 }
    }
  ]
}
```

---

## Offline-Szenarien

### Szenario 1: Lange Offline-Zeit

```mermaid
sequenceDiagram
    participant A as Anna (Gerät)
    participant S as Server

    Note over A: 2 Wochen offline

    A->>A: Erstellt 10 Items lokal

    Note over A: Wieder online

    A->>S: Push 10 Items
    S->>A: ACK

    A->>S: Pull changes seit 2 Wochen
    S->>A: 50 neue Items von Kontakten

    A->>A: CRDT Merge
```

### Szenario 2: Multi-Device Konflikt

```mermaid
sequenceDiagram
    participant P as Phone (offline)
    participant T as Tablet (offline)
    participant S as Server

    Note over P,T: Beide bearbeiten gleiches Item

    P->>P: title = "Meeting" @ 10:00
    T->>T: title = "Besprechung" @ 10:05

    Note over P: Phone kommt online
    P->>S: Push "Meeting"
    S->>P: ACK

    Note over T: Tablet kommt online
    T->>S: Push "Besprechung"
    S->>T: Conflict: "Meeting" @ 10:00

    T->>T: CRDT Merge: "Besprechung" gewinnt (10:05 > 10:00)
    T->>S: Push merged state
    S->>P: "Besprechung" @ 10:05
```

---

## Daten-Priorisierung

### Was zuerst synchronisieren?

| Priorität | Datentyp | Grund |
|-----------|----------|-------|
| 1 (Hoch) | Verifizierungen | Ermöglicht Entschlüsselung |
| 2 | Kontakt-Status | Beeinflusst Sichtbarkeit |
| 3 | Item Keys | Ermöglicht Content-Zugriff |
| 4 | Items (Metadaten) | Übersicht |
| 5 (Niedrig) | Item Content | Kann lazy geladen werden |

---

## Framework-Agnostik

### Spezifikation bleibt abstrakt

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Diese Spezifikation definiert:                             │
│  ✅ CRDT-basierte Konfliktauflösung                         │
│  ✅ Offline-First Architektur                               │
│  ✅ Sync-Server als "dummer" Speicher                       │
│                                                             │
│  Nicht festgelegt:                                          │
│  ⏳ Konkretes CRDT-Framework                                │
│  ⏳ Wire Protocol Details                                   │
│  ⏳ Spezifische Sync-Library                                │
│                                                             │
│  Mögliche Implementierungen:                                │
│  • Automerge                                                │
│  • Yjs                                                      │
│  • Custom LWW-Implementierung                               │
│  • Electric SQL                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Weiterführend

- [Verschlüsselung](verschluesselung.md) - Wie Daten vor dem Sync verschlüsselt werden
- [Flow: Sync](../flows/05-sync-nutzer-flow.md) - Nutzer-Perspektive auf Sync
- [Automerge](https://automerge.org/) - Mögliches CRDT-Framework
- [Yjs](https://yjs.dev/) - Alternatives CRDT-Framework
