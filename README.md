# Web of Trust

Das Web of Trust vernetzt Menschen, die sich im echten Leben treffen, kooperieren und gegenseitig vertrauen.

## Konzept

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   VERIFIZIEREN  │ ──► │   KOOPERIEREN   │ ──► │   ATTESTIEREN   │
│                 │     │                 │     │                 │
│ Identität durch │     │ Verschlüsselte  │     │ Reputation      │
│ persönliches    │     │ Inhalte teilen  │     │ durch echte     │
│ Treffen         │     │ (Kalender,      │     │ Taten aufbauen  │
│ bestätigen      │     │ Karte, Projekte)│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Verifizieren ≠ Vertrauen**

Die Verifizierung bestätigt nur: "Das ist wirklich diese Person." Das eigentliche Vertrauen entsteht durch Attestationen über Zeit.

---

## Spezifikation

> **Wichtig:** Die Spezifikation beschreibt das Ziel-Design. Der aktuelle Implementierungsstand kann davon abweichen.
> Siehe [Current Implementation](docs/CURRENT_IMPLEMENTATION.md) für den tatsächlichen Stand.

### Einstieg

| Dokument | Beschreibung |
| -------- | ------------ |
| [Glossar](docs/GLOSSAR.md) | Begriffsdefinitionen |
| [Current Implementation](docs/CURRENT_IMPLEMENTATION.md) | ✅ Was ist bereits implementiert |

### Flows

Detaillierte Prozessbeschreibungen aus Nutzer- und technischer Perspektive.

| Nr | Flow | Nutzer | Technisch |
| -- | ---- | ------ | --------- |
| 01 | Onboarding | [Nutzer](docs/flows/01-onboarding-nutzer-flow.md) | [Technisch](docs/flows/01-onboarding-technisch-flow.md) |
| 02 | Verifizierung | [Nutzer](docs/flows/02-verifizierung-nutzer-flow.md) | [Technisch](docs/flows/02-verifizierung-technisch-flow.md) |
| 03 | Attestation | [Nutzer](docs/flows/03-attestation-nutzer-flow.md) | [Technisch](docs/flows/03-attestation-technisch-flow.md) |
| 04 | Content teilen | [Nutzer](docs/flows/04-content-nutzer-flow.md) | [Technisch](docs/flows/04-content-technisch-flow.md) |
| 05 | Synchronisation | [Nutzer](docs/flows/05-sync-nutzer-flow.md) | [Technisch](docs/flows/05-sync-technisch-flow.md) |
| 06 | Recovery | [Nutzer](docs/flows/06-recovery-nutzer-flow.md) | [Technisch](docs/flows/06-recovery-technisch-flow.md) |
| 07 | Ausblenden | [Nutzer](docs/flows/07-ausblenden-nutzer-flow.md) | [Technisch](docs/flows/07-ausblenden-technisch-flow.md) |
| 08 | Export | [Nutzer](docs/flows/08-export-nutzer-flow.md) | [Technisch](docs/flows/08-export-technisch-flow.md) |

[Alle Flows im Überblick](docs/flows/README.md)

### Datenmodell

| Dokument | Beschreibung |
| -------- | ------------ |
| [Entitäten](docs/datenmodell/entitaeten.md) | User, Contact, Item, Group, Attestation |
| [did:key Verwendung](docs/datenmodell/did-key-usage.md) | Wie dezentrale Identifier genutzt werden |
| [Graph und Sichtbarkeit](docs/datenmodell/graph-und-sichtbarkeit.md) | Lokaler Graph, Datenhoheit, gemeinsame Kontakte |
| [JSON Schemas](docs/datenmodell/json-schemas/) | Maschinenlesbare Schemas |

### Protokolle

| Dokument | Beschreibung |
| -------- | ------------ |
| [Adapter-Architektur v2](docs/protokolle/adapter-architektur-v2.md) | **6-Adapter-Spezifikation, Interaction-Flows** |
| [Framework-Evaluation v2](docs/protokolle/framework-evaluation.md) | 16 Frameworks evaluiert, Anforderungs-Matrix |
| [Verschlüsselung](docs/protokolle/verschluesselung.md) | E2E, Protokoll-Vergleich (MLS, Keyhive, Item-Keys) |
| [Sync-Protokoll](docs/protokolle/sync-protokoll.md) | Offline/Online, CRDTs |
| [QR-Code Formate](docs/protokolle/qr-code-formate.md) | Alle QR-Strukturen |

### Konzepte

| Dokument | Beschreibung |
| -------- | ------------ |
| [DID-Methoden-Vergleich](docs/konzepte/did-methoden-vergleich.md) | Evaluation von 6 DID-Methoden (did:key bestätigt) |
| [Social Recovery](docs/konzepte/social-recovery.md) | Shamir Secret Sharing über verifizierte Kontakte |
| [Identity Security](docs/konzepte/identity-security-architecture.md) | Sicherheitsarchitektur, Key-Schutz, Migration |

### Sicherheit

| Dokument | Beschreibung |
| -------- | ------------ |
| [Threat Model](docs/sicherheit/threat-model.md) | Angriffsvektoren & Mitigations |
| [Privacy](docs/sicherheit/privacy.md) | Datenschutz-Überlegungen |
| [Best Practices](docs/sicherheit/best-practices.md) | Implementierungsrichtlinien |

### Anhang

| Dokument | Beschreibung |
| -------- | ------------ |
| [Personas](docs/anhang/personas.md) | Detaillierte Persona-Beschreibungen |
| [User Stories](docs/anhang/user-stories.md) | Vollständige User Story Liste |
| [Offene Fragen](docs/anhang/offene-fragen.md) | Dokumentierte offene Punkte |

---

## Entwicklung

### Monorepo-Struktur

```text
web-of-trust/
├── packages/
│   └── wot-core/          # @web-of-trust/core - npm Package
├── apps/
│   ├── demo/              # Demo-Anwendung (React 19)
│   └── landing/           # Landing Page
└── docs/                  # Protokoll-Spezifikation
```

### Schnellstart

```bash
# Dependencies installieren
pnpm install

# Demo starten
pnpm dev:demo

# Landing Page starten
pnpm dev:landing

# wot-core bauen
pnpm build:core
```

### @web-of-trust/core

Das Core-Package exportiert:

```typescript
// Types
import type { Identity, Contact, Verification, Attestation } from '@web-of-trust/core'

// Adapter Interfaces (v1 — implementiert)
import type { StorageAdapter, CryptoAdapter, ReactiveStorageAdapter } from '@web-of-trust/core'

// Crypto Utilities
import { createDid, signJws, verifyJws } from '@web-of-trust/core'

// Adapter Implementations
import { WebCryptoAdapter, LocalStorageAdapter } from '@web-of-trust/core'
```

> **Adapter-Architektur v2:** Zusätzlich zu den 3 bestehenden Adaptern definiert die v2-Architektur
> 3 neue Interfaces: `MessagingAdapter`, `ReplicationAdapter`, `AuthorizationAdapter`.
> Siehe [Adapter-Architektur v2](docs/protokolle/adapter-architektur-v2.md).

---

## Beitragen

Der Forschungsprototyp ist verfügbar: [github.com/IT4Change/web-of-trust](https://github.com/IT4Change/web-of-trust)

Wir suchen:

- Gemeinschaften die es ausprobieren wollen
- Feedback zu UX und Konzept
- Entwickler die mitbauen wollen

---

*Diese Spezifikation ist ein lebendiges Dokument und wird basierend auf Erkenntnissen aus der Erprobung aktualisiert.*
