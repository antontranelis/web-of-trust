# Web of Trust

[![CI](https://github.com/antontranelis/web-of-trust/actions/workflows/ci.yml/badge.svg)](https://github.com/antontranelis/web-of-trust/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@real-life/wot-core)](https://www.npmjs.com/package/@real-life/wot-core)

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
| [Adapter-Architektur v2](docs/protokolle/adapter-architektur-v2.md) | **7-Adapter-Spezifikation, Interaction-Flows** |
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
│   ├── wot-core/          # @real-life/wot-core - npm Package
│   ├── wot-relay/         # WebSocket Relay Server (Node.js, SQLite)
│   └── wot-profiles/      # HTTP Profile Service (REST, SQLite, JWS)
├── apps/
│   ├── demo/              # Demo-Anwendung (React 19, Evolu, i18n)
│   └── landing/           # Landing Page
└── docs/                  # Protokoll-Spezifikation
```

### Schnellstart

```bash
# Dependencies installieren
pnpm install

# Demo starten (Deutsch/Englisch, Browser-Spracherkennung)
pnpm dev:demo

# Landing Page starten
pnpm dev:landing

# wot-core bauen
pnpm build:core

# Tests ausführen
pnpm --filter wot-core test
pnpm --filter wot-relay test
pnpm --filter wot-profiles test
```

### Live-Infrastruktur

| Service | URL | Beschreibung |
| ------- | --- | ------------ |
| Relay | `wss://relay.utopia-lab.org` | WebSocket Relay (Blind, ACK-Protokoll) |
| Profiles | `https://profiles.utopia-lab.org` | HTTP Profile Service (JWS-signiert) |
| Demo | [web-of-trust.de/demo](https://web-of-trust.de/demo) | Demo-Anwendung |

### @real-life/wot-core

Das Core-Package exportiert:

```typescript
// Types
import type {
  Identity, Contact, Verification, Attestation,
  PublicProfile, MessageEnvelope, ProfileResolveResult,
} from '@real-life/wot-core'

// Adapter Interfaces (7-Adapter v2)
import type {
  StorageAdapter, ReactiveStorageAdapter, CryptoAdapter,
  DiscoveryAdapter, MessagingAdapter, ReplicationAdapter,
  // AuthorizationAdapter (spezifiziert, noch nicht implementiert)
} from '@real-life/wot-core'

// Adapter Implementations
import {
  WebCryptoAdapter,
  HttpDiscoveryAdapter, OfflineFirstDiscoveryAdapter,
  InMemoryMessagingAdapter, WebSocketMessagingAdapter, OutboxMessagingAdapter,
  AutomergeReplicationAdapter,
} from '@real-life/wot-core'

// Services
import { ProfileService, GraphCacheService, EncryptedSyncService, GroupKeyService } from '@real-life/wot-core'
```

**300 Tests** (251 wot-core + 25 wot-profiles + 24 wot-relay) — alle passing ✅

---

## Beitragen

Wir suchen:

- Gemeinschaften die es ausprobieren wollen
- Feedback zu UX und Konzept
- Entwickler die mitbauen wollen

---

*Diese Spezifikation ist ein lebendiges Dokument und wird basierend auf Erkenntnissen aus der Erprobung aktualisiert.*
