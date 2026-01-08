# Datenmodell

> Übersicht aller Entitäten und Datenstrukturen im Web of Trust

## Inhalt

| Dokument | Beschreibung |
|----------|--------------|
| [Entitäten](entitaeten.md) | Vollständiges ER-Diagramm aller Entitäten |
| [did:key Verwendung](did-key-usage.md) | Wie `did:key` im System genutzt wird |
| [JSON-Schemas](json-schemas/) | Maschinenlesbare Schemas zur Validierung |

---

## Übersicht der Entitäten

```mermaid
erDiagram
    IDENTITY ||--o{ CONTACT : "verifiziert"
    IDENTITY ||--o{ ATTESTATION : "erstellt"
    IDENTITY ||--o{ ITEM : "besitzt"
    IDENTITY ||--o{ GROUP : "ist Mitglied"

    CONTACT ||--o{ ATTESTATION : "erhält"

    GROUP ||--o{ ITEM : "enthält"
    GROUP ||--o{ IDENTITY : "hat Mitglieder"

    ITEM ||--o{ ITEM_KEY : "verschlüsselt mit"
```

---

## Kernentitäten

### Identity (Eigene Identität)

Die eigene digitale Identität des Nutzers.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| did | `did:key` | Dezentraler Identifier |
| publicKey | Ed25519 | Öffentlicher Schlüssel |
| name | String | Anzeigename |
| bio | String? | Optionale Beschreibung |
| photo | Blob? | Profilbild |
| createdAt | DateTime | Erstellungszeitpunkt |

### Contact (Verifizierter Kontakt)

Ein gegenseitig verifizierter Kontakt.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| did | `did:key` | DID des Kontakts |
| publicKey | Ed25519 | Öffentlicher Schlüssel |
| name | String | Anzeigename |
| status | Enum | `pending`, `active`, `hidden` |
| verifiedAt | DateTime | Zeitpunkt der gegenseitigen Verifizierung |
| myVerification | URN | Referenz auf meine Verifizierung |
| theirVerification | URN | Referenz auf deren Verifizierung |

### Attestation

Eine signierte Aussage über einen Kontakt.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | URN | Eindeutige ID |
| from | `did:key` | Ersteller |
| to | `did:key` | Empfänger |
| claim | String | Die Aussage |
| tags | String[] | Kategorisierung |
| createdAt | DateTime | Erstellungszeitpunkt |
| proof | Signature | Ed25519-Signatur |

### Item (Content-Eintrag)

Ein Inhaltselement (Kalender, Karte, Projekt, etc.).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | URN | Eindeutige ID |
| type | Enum | `calendar`, `map`, `project`, ... |
| title | String | Titel |
| content | Encrypted | Verschlüsselter Inhalt |
| visibility | Enum | `private`, `contacts`, `group`, `selective` |
| ownerDid | `did:key` | Besitzer |
| createdAt | DateTime | Erstellungszeitpunkt |

### Group (Explizite Gruppe)

Eine explizit erstellte Gruppe.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| did | `did:key` | Gruppen-DID |
| name | String | Gruppenname |
| members | `did:key[]` | Mitglieder-DIDs |
| admins | `did:key[]` | Admin-DIDs |
| createdAt | DateTime | Erstellungszeitpunkt |

---

## Spezielle Konstrukte

### Auto-Gruppe

Die implizite Gruppe aller aktiven Kontakte.

```
┌─────────────────────────────────────────┐
│                                         │
│  Auto-Gruppe (implizit)                 │
│                                         │
│  Mitglieder = alle Kontakte mit         │
│               status = "active"         │
│                                         │
│  Wird automatisch aktualisiert bei:     │
│  • Neue Verifizierung → hinzufügen      │
│  • Kontakt ausblenden → entfernen       │
│  • Kontakt wiederherstellen → hinzufügen│
│                                         │
└─────────────────────────────────────────┘
```

### Verification (Gegenseitige Verifizierung)

Besteht aus zwei Einzelverifizierungen.

```mermaid
flowchart LR
    A[Anna] -->|"signiert"| V1[Verification A→B]
    B[Ben] -->|"signiert"| V2[Verification B→A]

    V1 & V2 -->|"zusammen"| MV[Gegenseitige Verifizierung]
```

---

## JSON-Schemas

Maschinenlesbare Schemas für Validierung:

- [`profile.schema.json`](json-schemas/profile.schema.json)
- [`verification.schema.json`](json-schemas/verification.schema.json)
- [`attestation.schema.json`](json-schemas/attestation.schema.json)
- [`item.schema.json`](json-schemas/item.schema.json)

---

## Weiterführend

- [Entitäten im Detail](entitaeten.md) - Vollständiges ER-Diagramm mit Beziehungen
- [did:key Verwendung](did-key-usage.md) - Wie DIDs generiert und verwendet werden
- [Verschlüsselung](../protokolle/verschluesselung.md) - Wie Items verschlüsselt werden
