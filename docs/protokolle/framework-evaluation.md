# Framework-Evaluation

> Analyse von Local-First, CRDT und E2EE Frameworks für das Web of Trust

## Motivation

Das Web of Trust benötigt:
- **Offline-First**: Alle Operationen funktionieren ohne Verbindung
- **E2E-Verschlüsselung**: Server sieht nur verschlüsselte Daten
- **CRDTs**: Automatische, deterministische Konfliktauflösung
- **DID-Kompatibilität**: Interoperabilität mit W3C Standards
- **React Native**: Mobile-First Entwicklung

Diese Evaluation untersucht existierende Frameworks und definiert eine framework-agnostische Architektur.

---

## Evaluierte Frameworks

### Übersicht

| Framework | E2EE | DID | CRDT | React/Web | Reife |
|-----------|------|-----|------|-----------|-------|
| [NextGraph](#nextgraph) | ✅ Native | ✅ did:ng | Yjs + Automerge + Graph | ⚠️ SDK kommt | Alpha |
| [Evolu](#evolu) | ✅ Native | ❌ | SQLite + LWW | ✅ Erstklassig | Produktiv |
| [p2panda](#p2panda) | ✅ Double Ratchet | ❌ | Beliebig (BYOC) | ❌ Kein SDK | Pre-1.0 |
| [Jazz](#jazz) | ✅ Native | ❌ | CoJSON | ✅ Dokumentiert | Beta |
| [Secsync](#secsync) | ✅ Native | ❌ | Agnostisch | ⚠️ Unklar | Beta |
| [DXOS](#dxos) | ✅ Native | ❌ | Automerge | ❌ Web only | Produktiv |
| [Keyhive](#keyhive) | ✅ BeeKEM | ❌ | - | ❌ Rust | Pre-Alpha |
| [Loro](#loro) | ❌ Selbst | ❌ | ✅ Eigenes | ✅ WASM+Swift | Produktiv |
| [Yjs](#yjs) | ❌ Selbst | ❌ | ✅ Eigenes | ✅ | Produktiv |
| [Automerge](#automerge) | ❌ Selbst | ❌ | ✅ Eigenes | ⚠️ WASM | Produktiv |

### Kategorisierung

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Local-First + E2EE Landscape                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MIT DID-SUPPORT:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ NextGraph     │ DID für User + Dokumente, RDF/SPARQL                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  MIT EINGEBAUTEM E2EE (ohne DID):                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Evolu         │ BIP39 Mnemonic, SQLite, React Native                │   │
│  │ Jazz          │ Account Keys, CoJSON                                │   │
│  │ Secsync       │ XChaCha20-Poly1305, Framework-agnostisch            │   │
│  │ p2panda       │ Double Ratchet, modularer Rust-Stack                │   │
│  │ Keyhive       │ BeeKEM für Gruppen-Keys                             │   │
│  │ DXOS          │ HALO Protocol, Web-fokussiert                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CRDT-ONLY (E2EE selbst bauen):                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Loro          │ High-Performance, Rust + WASM + Swift               │   │
│  │ Yjs           │ Größte Community, viele Bindings                    │   │
│  │ Automerge     │ Elegantes API, Ink & Switch                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PROTOKOLLE (Framework-agnostisch):                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Ossa Protocol │ Universal Sync Protocol (Prototyp)                  │   │
│  │ Braid (IETF)  │ HTTP-Erweiterung für Sync                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailanalysen

### NextGraph

> Decentralized, encrypted and local-first platform

**Website:** https://nextgraph.org/
**Gitea:** https://git.nextgraph.org/NextGraph/nextgraph-rs
**GitHub Mirror:** https://github.com/nextgraph-org/nextgraph-rs (~73 ⭐)
**Status:** Alpha (v0.1.2-alpha.1)
**Maintainer:** ~3 (Niko Bonnieure primary)
**Funding:** EU NLnet/NGI Grants + Donations

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Identität** | `did:ng` für User und Dokumente, Multiple Personas pro Wallet |
| **E2EE** | Ja, capability-basiert (nicht Signal/Matrix) |
| **CRDTs** | 3 Modelle: Graph CRDT (RDF, custom) + Automerge + Yjs |
| **Datenmodell** | RDF Triples + SPARQL, JSON, Rich Text, Markdown |
| **Gruppen** | Cryptographic Capabilities (Editor/Reader/Signer Rollen) |
| **Sync** | 2-Tier Broker Network, P2P Pub/Sub, DAG von Commits |
| **Transport** | WebSocket + Noise Protocol (kein TLS/DNS nötig) |
| **Sprachen** | Rust (76%), TypeScript (14%), Svelte (6%) |
| **SDKs** | Rust (crates.io), JS/TS (WASM, noch Alpha), Node.js, Deno geplant |
| **Plattformen** | Linux, macOS, Windows, Android, iOS (TestFlight), Web |
| **Storage** | RocksDB (encrypted at rest) |

#### Architektur

```
┌─────────────────────────────────────────────────────┐
│                    NextGraph                         │
│                                                      │
│  Tier 1: Core Brokers (Server, 24/7, relay)         │
│     ↕ WebSocket + Noise Protocol                    │
│  Tier 2: Edge/Local Brokers (Client-side daemon)    │
│     ↕                                                │
│  Documents: DAG von Commits                          │
│     ├── Graph Part (RDF, mandatory)                  │
│     ├── Discrete Part (Yjs/Automerge, optional)      │
│     └── Binary Files (optional)                      │
│                                                      │
│  Overlays pro Repo:                                  │
│     ├── Inner Overlay (Write-Access, Peers kennen    │
│     │   einander)                                    │
│     └── Outer Overlay (Read-Only, anonymer)          │
└─────────────────────────────────────────────────────┘
```

#### Einzigartige Features

- **3 CRDTs vereint:** Graph CRDT (RDF) + Automerge + Yjs auf Branch-Ebene mischbar
- **SPARQL auf verschlüsselten Local-First Daten** - einzigartig
- **Social Queries:** Federated SPARQL über verschlüsselte P2P-Daten anderer User
- **Pazzle-Auth:** 9 Bilder als Passwort-Alternative (mental narrative)
- **Smart Contracts ohne Blockchain:** FSM + WASM Verifier
- **Nuri (NextGraph URI):** Permanente kryptografische Dokument-IDs mit eingebetteten Capabilities
- **ShEx → TypeScript:** RDF-Schemas werden zu getypten TS-Objekten mit Proxy-Reactivity

#### Bewertung für Web of Trust (aktualisiert 2026-02-07)

```
Vorteile:
✅ DID-Support eingebaut (einziges Framework mit did:ng!)
✅ RDF-Graph = natürliches Modell für Vertrauensnetzwerk
✅ Capability-basierte Crypto = passt zu WoT Permissions
✅ E2EE + Encryption at Rest mandatory
✅ Kein DNS, kein TLS, kein Single Point of Failure
✅ SPARQL ermöglicht mächtige Graph-Queries über Trust-Beziehungen
✅ Consumer App + Developer Framework (Social Network eingebaut)

Nachteile:
❌ Alpha - NICHT produktionsreif (v0.1.2-alpha)
❌ JS/React SDK noch nicht released (kommt Anfang 2026)
❌ Kein Custom Key Import - Wallet generiert eigene Keys
   → Integration mit bestehendem BIP39 Seed problematisch
❌ Sehr kleine Community (~73 Stars, ~3 Contributors)
❌ Grant-abhängige Finanzierung (Nachhaltigkeit?)
⚠️ Extrem komplex (3 CRDTs, RDF, SPARQL, Noise Protocol, Broker Network)
⚠️ Rust-basiert → WASM für Web, Integration aufwendiger
⚠️ Single-Point-of-Knowledge Risiko (Niko Bonnieure)
```

**Empfehlung:** Philosophisch am nächsten an unserer Vision. Beobachten und evaluieren sobald JS SDK verfügbar. Für POC nicht geeignet wegen fehlender Custom-Key-Integration und Alpha-Status. Langfristig der interessanteste Kandidat.

---

### Evolu

> Local-first platform with E2EE and SQLite

**Website:** <https://evolu.dev/>
**GitHub:** <https://github.com/evoluhq/evolu> (~1.8k ⭐)
**Status:** Produktiv (v7/v8, Major Rewrite laufend)
**Maintainer:** 1 primary (Daniel Steigerwald), wenige weitere
**Lizenz:** MIT

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Identität** | SLIP-21 Key Derivation aus 16 Bytes Entropy, BIP39 Mnemonic |
| **E2EE** | Ja, symmetric (quantum-safe) + PADME Padding |
| **CRDTs** | LWW (Last-Write-Wins) per Cell (Table/Row/Column) |
| **Datenmodell** | SQLite mit Branded TypeScript-Typen (Kysely Query Builder) |
| **Sync** | Range-Based Set Reconciliation, Hybrid Logical Clocks, binäres Protokoll |
| **Transport** | WebSocket zu Relay-Server (self-hostable) |
| **Sprachen** | TypeScript |
| **Plattformen** | Web (OPFS), React Native, Expo, Electron, Svelte, Vue |
| **Custom Keys** | ✅ Ja! `ownerId`, `writeKey`, `encryptionKey` direkt übergeben (seit Nov 2025, Issue #537) |

#### Architektur

```
Browser/App (SQLite lokal, OPFS)
    ↕ WebSocket (E2E encrypted, binary)
Relay Server (stateless, sieht nur encrypted blobs)
    ↕ WebSocket
Anderes Gerät (SQLite lokal)

Relay kann NICHT:
- Daten lesen (E2E encrypted)
- Muster erkennen (PADME Padding)
- User korrelieren

Relay ist:
- Self-hostable (Docker, Render, AWS Lambda)
- Free Relay verfügbar: free.evoluhq.com
- Empfohlen: 2 Relays (lokal + geo-distant backup)
```

#### Owner-Modelle

- **AppOwner** - Single-User (Standard, unser Usecase)
- **SharedOwner** - Collaborative Multi-User
- **SharedReadonlyOwner** - Nur-Lesen Collaboration
- **ShardOwner** - Logische Datenpartitionierung (Partial Sync)

#### Custom Key Integration (kritisch für uns!)

```typescript
// Evolu mit WotIdentity-Keys initialisieren:
const evolKey = await identity.deriveFrameworkKey('evolu-storage-v1')

const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  ownerId: identity.getDid(),
  writeKey: deriveWriteKey(evolKey),
  encryptionKey: deriveEncryptionKey(evolKey),
  transports: [{ type: "WebSocket", url: "wss://our-relay.example.com" }],
})
```

Dieses Feature wurde vom Trezor-Team angefragt und in Issue #537 implementiert.

#### Bewertung für Web of Trust (aktualisiert 2026-02-07)

```
Vorteile:
✅ Custom Keys! → direkte Integration mit WotIdentity.deriveFrameworkKey()
✅ BIP39 Mnemonic als Basis (gleiche Philosophie wie wir)
✅ React/Svelte/Vue erstklassig unterstützt
✅ React Native + Expo voll unterstützt
✅ SQLite = vertraute Queries mit Kysely (type-safe)
✅ E2EE mandatory, Relay blind
✅ Produktionsnah, aktive Entwicklung
✅ Self-hostable Relay (Docker, ein Klick auf Render)
✅ Partial Sync (temporal + logical) für Skalierung
✅ PADME Padding gegen Traffic-Analyse

Nachteile:
⚠️ Single-Maintainer Risiko (steida = 99% der Commits)
⚠️ Major Rewrite laufend (Effect entfernt, neuer Sync)
⚠️ Kein DID-Support (muss selbst gebaut werden → haben wir schon)
⚠️ LWW-CRDT ist simpel (kein Rich-Text-Merging wie Yjs)
⚠️ Relay nötig für Sync (kein echtes P2P, aber auf Roadmap)
⚠️ SQL-Paradigma vs. Graph-Datenmodell
```

**Empfehlung:** Primärer Kandidat für POC. Pragmatisch, stabil, Custom-Key-Support ist der Gamechanger. DID-Layer haben wir bereits (WotIdentity).

---

### Jazz

> Primitives for building local-first apps

**Website:** https://jazz.tools/
**GitHub:** https://github.com/garden-co/jazz
**Status:** Beta

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Identität** | Account Keys (Passphrase-basiert) |
| **E2EE** | Ja, mit Signatures |
| **CRDTs** | CoJSON (eigenes Format) |
| **Datenmodell** | Collaborative JSON ("CoValues") |
| **Gruppen** | Eingebaut mit Permissions |
| **Sprachen** | TypeScript |
| **Plattformen** | Web, React Native (dokumentiert) |

#### Bewertung für Web of Trust

```
Vorteile:
✅ Elegantes API ("feels like reactive local JSON")
✅ Gruppen mit Permissions eingebaut
✅ React Native dokumentiert
✅ Passphrase Recovery (ähnlich Mnemonic)
✅ Aktive Entwicklung

Nachteile:
⚠️ Kein DID-Support
⚠️ Noch Beta
⚠️ CoJSON ist proprietär
⚠️ Weniger Kontrolle über Crypto
```

**Empfehlung:** Alternative zu Evolu. Eleganter, aber weniger ausgereift.

---

### Secsync

> Architecture for E2E encrypted CRDTs

**Website:** https://secsync.com/
**GitHub:** https://github.com/nikgraf/secsync (225 ⭐)
**Status:** Beta

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Identität** | Ed25519 Keys (extern verwaltet) |
| **E2EE** | XChaCha20-Poly1305-IETF |
| **CRDTs** | Agnostisch (Yjs, Automerge Beispiele) |
| **Konzept** | Snapshots + Updates + Ephemeral Messages |
| **Key Exchange** | Extern (Signal Protocol oder PKI) |
| **Sprachen** | TypeScript |

#### Bewertung für Web of Trust

```
Vorteile:
✅ Framework-agnostisch (Yjs oder Automerge)
✅ Saubere E2EE-Architektur dokumentiert
✅ Server sieht nur verschlüsselte Blobs
✅ Snapshot + Update Modell effizient

Nachteile:
⚠️ Key Exchange muss selbst gebaut werden
⚠️ React Native Support unklar
⚠️ Noch Beta
⚠️ Kleinere Community
```

**Empfehlung:** Gute Referenz-Architektur. Konzepte übernehmen, wenn wir selbst bauen.

---

### p2panda

> Modular toolkit for local-first P2P applications

**Website:** <https://p2panda.org/>
**GitHub:** <https://github.com/p2panda/p2panda> (~394 ⭐)
**Status:** Pre-1.0 (v0.5.0, Jan 2026) - aktive Entwicklung
**Maintainer:** 4 (adzialocha, sandreae, mycognosist, cafca)
**Funding:** EU NLnet/NGI Grants (POINTER, ASSURE, ENTRUST, Commons Fund)
**Lizenz:** Apache 2.0 / MIT

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Identität** | Ed25519 pro Device, KeyGroups für Multi-Device |
| **E2EE** | Data: XChaCha20-Poly1305 + PCS. Messages: Double Ratchet (Signal-like) |
| **CRDTs** | BYOC - Bring Your Own (Automerge, Yjs, Loro, custom) |
| **Datenmodell** | Append-Only Logs (Namakemono Spec), data-type-agnostic |
| **Sync** | Bidirectional Push + PlumTree/HyParView Gossip |
| **Transport** | QUIC (iroh), mDNS, Bootstrap Nodes |
| **Sprachen** | Rust (9 modulare Crates) |
| **Plattformen** | Desktop (GTK/Tauri), Mobile (Flutter FFI), IoT |
| **JS SDK** | Veraltet! `p2panda-js` v0.8.1 (~2 Jahre alt, pre-rewrite) |

#### Modulare Crates

| Crate | Funktion |
|-------|----------|
| **p2panda-core** | Erweiterbare Datentypen (Operations, Headers, Bodies) |
| **p2panda-net** | P2P Networking, Discovery, Gossip |
| **p2panda-discovery** | Confidential Peer/Topic Discovery |
| **p2panda-sync** | Append-Only Log Synchronization |
| **p2panda-blobs** | Large File Transfer |
| **p2panda-store** | SQLite, Memory, Filesystem Persistence |
| **p2panda-stream** | Stream Processing Middleware |
| **p2panda-encryption** | Group Encryption (2 Schemes) |
| **p2panda-auth** | Decentralized Access Control |

#### Verschlüsselung (2 Schemes)

**Data Encryption** (für persistente Gruppendaten):
- Symmetric Key für alle Gruppenmitglieder
- Post-Compromise Security (Key Rotation bei Member-Removal)
- XChaCha20-Poly1305

**Message Encryption** (für ephemere Nachrichten):
- Double Ratchet Algorithm (wie Signal)
- Jede Nachricht bekommt eigenen Key → starke Forward Secrecy
- AES-256-GCM

#### Real-World Apps

- **Reflection** - Collaborative local-first GTK Text Editor (224 ⭐)
- **Meli** - Android App für Bienenarten-Kategorisierung (Brasilien, Flutter)
- **Toolkitty** - Koordinations-App für Kollektive

#### Bewertung für Web of Trust (aktualisiert 2026-02-07)

```
Vorteile:
✅ Echtes P2P (kein Server/Relay nötig!)
✅ Funktioniert über LoRa, Bluetooth, Shortwave, USB-Stick (!!)
✅ Modularer Ansatz (pick what you need)
✅ Double Ratchet = Signal-Level Forward Secrecy
✅ Post-Compromise Security bei Gruppen
✅ Confidential Discovery (Peers finden sich ohne Interessen preiszugeben)
✅ EU-gefördert (NLnet), Security Audit geplant
✅ 4 aktive Contributors (besser als Single-Maintainer)
✅ Ed25519 Keys (wie wir), Custom Keys möglich

Nachteile:
❌ KEIN aktuelles JavaScript/Web SDK (Knockout für React-basierte App!)
❌ Pre-1.0 - nicht produktionsreif
⚠️ Rust-basiert → WASM oder FFI für Web nötig
⚠️ Kein DID-Support
⚠️ Kein BIP39/Mnemonic Support eingebaut
⚠️ Wiederholte Architectural Rewrites (Bamboo→Namakemono, aquadoggo→modular)
⚠️ Dokumentation verstreut (Blog Posts, altes Handbook, Rust Docs)
```

**Empfehlung:** Philosophisch sehr nahe (echtes P2P, Offline-First radikal). Für Web-App aktuell nicht nutzbar wegen fehlendem JS SDK. Beobachten für: (1) Langfrist-Vision mit LoRa/BLE für Offline-Gemeinschaften, (2) Einzelne Crates (p2panda-encryption, p2panda-auth) als Inspiration. FOSDEM 2026 Talk zeigt wachsendes GNOME/Linux-Desktop-Interest.

---

### DXOS

> Decentralized developer platform

**Website:** https://dxos.org/
**GitHub:** https://github.com/dxos/dxos (483 ⭐)
**Status:** Produktiv

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Identität** | HALO Protocol (eigenes System) |
| **E2EE** | Ja, über ECHO Protocol |
| **CRDTs** | Yjs / Automerge via Adapter |
| **Datenmodell** | Graph-basiert (Spaces, Objects) |
| **Sync** | P2P via WebRTC |
| **Sprachen** | TypeScript |

#### Bewertung für Web of Trust

```
Vorteile:
✅ Graph-Modell passt zu Web of Trust
✅ Spaces-Konzept ähnlich unseren Gruppen
✅ Produktionsreif
✅ Gute TypeScript-Typen

Nachteile:
❌ Kein React Native Support
⚠️ Web-fokussiert
⚠️ Kein DID-Support
⚠️ Komplexes eigenes Protokoll
```

**Empfehlung:** Nicht für Mobile geeignet. Konzepte (Spaces, HALO) interessant.

---

### Keyhive

> Decentralized group key management

**Website:** https://www.inkandswitch.com/keyhive/
**GitHub:** https://github.com/inkandswitch/keyhive (177 ⭐)
**Status:** Pre-Alpha (Forschung)

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Fokus** | Gruppenkey-Management für Local-First |
| **Protokoll** | BeeKEM (basiert auf TreeKEM) |
| **Features** | Forward Secrecy, Post-Compromise Security |
| **Skalierung** | Logarithmisch (tausende Members) |
| **Sprachen** | Rust + WASM |

#### Bewertung für Web of Trust

```
Vorteile:
✅ Löst genau das Gruppenkey-Problem
✅ Von Ink & Switch (Automerge-Macher)
✅ Capability-basiertes Access Control
✅ Designed für CRDTs

Nachteile:
❌ Pre-Alpha, nicht auditiert
❌ Kein React Native
⚠️ Nur Key Management, kein vollständiges Framework
⚠️ API noch instabil
```

**Empfehlung:** Beobachten für Gruppen-Verschlüsselung. Könnte Evolu/Jazz ergänzen wenn stabil.

---

### Loro

> High-performance CRDT library

**Website:** https://loro.dev/
**GitHub:** https://github.com/loro-dev/loro
**Status:** Produktiv

#### Eigenschaften

| Aspekt | Details |
|--------|---------|
| **Fokus** | Performance-optimierte CRDTs |
| **Datentypen** | Map, List, Text, MovableTree |
| **Features** | Time Travel, Undo/Redo |
| **Sprachen** | Rust, WASM, Swift |
| **E2EE** | Nicht eingebaut |

#### Bewertung für Web of Trust

```
Vorteile:
✅ Beste Performance (Memory, CPU, Loading)
✅ MovableTree für hierarchische Daten
✅ Swift-Bindings für iOS
✅ Aktive Entwicklung

Nachteile:
❌ Kein E2EE (selbst bauen)
❌ Kein DID
⚠️ Nur CRDT-Engine, kein Sync
```

**Empfehlung:** Wenn wir CRDT-Engine selbst wählen, ist Loro der Performance-Champion.

---

### Yjs & Automerge

Klassische CRDT-Libraries, gut dokumentiert. Keine E2EE, kein DID.

| Aspekt | Yjs | Automerge |
|--------|-----|-----------|
| **Performance** | Sehr schnell | Gut |
| **Bundle Size** | ~50KB | ~200KB (WASM) |
| **Community** | Sehr groß | Groß |
| **Bindings** | Viele (Prosemirror, Monaco) | Weniger |
| **React Native** | Ja | WASM nötig |

**Empfehlung:** Gute Basis wenn wir E2EE selbst bauen wollen.

---

## Warum haben diese Frameworks keinen DID-Support?

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Unterschiedliche Design-Philosophien                    │
│     • Local-First: Geschlossenes Ökosystem                 │
│     • DIDs: Universelle Interoperabilität                  │
│                                                             │
│  2. DIDs sind "zu viel" für ihren Usecase                  │
│     • Sie brauchen nur Public Key für Crypto                │
│     • DID Document ist Overhead                             │
│                                                             │
│  3. Resolver-Problem                                        │
│     • did:web braucht HTTP (nicht offline-first!)          │
│     • did:key ist self-describing, aber warum DID-String?  │
│                                                             │
│  4. Historische Entwicklung                                 │
│     • CRDTs und DIDs entwickelten sich parallel            │
│     • Welten treffen sich erst jetzt                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Unsere Lösung: DID-Layer über Framework

```typescript
// Framework speichert Bytes, wir interpretieren als DID

class WotIdentity {
  private keyPair: KeyPair;

  // Für externe Systeme: DID
  get did(): string {
    return publicKeyToDid(this.keyPair.publicKey);
  }

  // Für Framework-interne Nutzung
  get publicKey(): Uint8Array {
    return this.keyPair.publicKey;
  }
}
```

---

## Framework-Agnostische Architektur

### Schichten-Modell

```
┌─────────────────────────────────────────────────────────────┐
│                     WoT Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WoT Domain Layer                        │   │
│  │  • Identity, Contact, Verification, Attestation     │   │
│  │  • Item, Group, AutoGroup                           │   │
│  │  • Business Logic (Empfänger-Prinzip)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WoT Adapter Interfaces                  │   │
│  │  • WotStorage (Lesen/Schreiben/Sync)                │   │
│  │  • WotCrypto (Signing/Encryption/DID)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│           ┌───────────────┼───────────────┐                │
│           ▼               ▼               ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │EvoluAdapter │  │ JazzAdapter │  │CustomAdapter│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### WotStorage Interface

```typescript
interface WotStorage {
  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Identity (lokal, wird nicht synchronisiert)
  getIdentity(): Promise<Identity | null>;
  createIdentity(name: string): Promise<Identity>;

  // Contacts (abgeleitet aus Verifications)
  getContacts(): Promise<Contact[]>;
  getContactByDid(did: string): Promise<Contact | null>;

  // Verifications (Empfänger-Prinzip: ich empfange)
  getReceivedVerifications(): Promise<Verification[]>;
  saveReceivedVerification(v: Verification): Promise<void>;

  // Attestations (Empfänger-Prinzip: ich empfange)
  getReceivedAttestations(): Promise<Attestation[]>;
  saveReceivedAttestation(a: Attestation): Promise<void>;
  setAttestationHidden(id: string, hidden: boolean): Promise<void>;

  // Items (ich besitze)
  getItems(): Promise<Item[]>;
  saveItem(item: Item): Promise<void>;
  deleteItem(id: string): Promise<void>;

  // Sync Events
  onDataChanged(callback: (changes: Change[]) => void): () => void;
  getSyncStatus(): SyncStatus;
}

interface SyncStatus {
  isOnline: boolean;
  pendingChanges: number;
  lastSyncedAt: Date | null;
}
```

### WotCrypto Interface

```typescript
interface WotCrypto {
  // Key Management
  generateKeyPair(): Promise<KeyPair>;
  deriveFromMnemonic(mnemonic: string): Promise<KeyPair>;
  generateMnemonic(): string;

  // Signing (Ed25519)
  sign(data: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
  verify(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean>;

  // Encryption (X25519 + AES-256-GCM)
  encrypt(plaintext: Uint8Array, recipientPublicKeys: Uint8Array[]): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload, privateKey: Uint8Array): Promise<Uint8Array>;

  // DID Conversion
  publicKeyToDid(publicKey: Uint8Array): string;
  didToPublicKey(did: string): Uint8Array;
}
```

---

## Empfehlungen (aktualisiert 2026-02-07)

### Entscheidung: Evolu für POC

Nach detaillierter Evaluation aller Kandidaten ist **Evolu** die klare Wahl für unseren POC:

| Kriterium | Evolu | NextGraph | p2panda |
|-----------|-------|-----------|---------|
| **React/Web SDK** | ✅ Erstklassig | ❌ Noch nicht released | ❌ Veraltet |
| **Custom Keys** | ✅ Seit Nov 2025 | ❌ Eigene Wallet | ⚠️ Ed25519 möglich |
| **BIP39/Mnemonic** | ✅ Eingebaut | ⚠️ Pazzle/Mnemonic | ❌ Nicht eingebaut |
| **Produktionsreife** | ✅ v7/v8 | ❌ Alpha | ❌ Pre-1.0 |
| **E2EE** | ✅ Mandatory | ✅ Mandatory | ✅ Signal-Level |
| **DID-Support** | ❌ (haben wir) | ✅ did:ng | ❌ |
| **Echtes P2P** | ❌ Relay | ⚠️ Broker | ✅ Direkt |
| **Offline Radikal** | ⚠️ Lokal ja | ⚠️ Lokal ja | ✅ LoRa/BLE/USB |

### Tier-Einteilung

**Tier 1: POC-Implementierung**

| Framework | Rolle | Begründung |
|-----------|-------|------------|
| **Evolu** | Storage + Sync | Custom Keys, React, BIP39, E2EE, sofort nutzbar |

**Tier 2: Beobachten für Mittelfrist**

| Framework | Wann relevant | Begründung |
|-----------|--------------|------------|
| **NextGraph** | Wenn JS SDK + Custom Keys | Philosophisch am nächsten, RDF-Graph ideal für WoT |
| **p2panda** | Wenn Web SDK verfügbar | Echtes P2P, LoRa/BLE für Offline-Gemeinschaften |
| **Keyhive** | Wenn stabil | BeeKEM für Gruppen-Verschlüsselung |

**Tier 3: Bausteine & Inspiration**

| Framework | Was wir nutzen können |
|-----------|----------------------|
| **Secsync** | Architektur-Referenz für E2EE |
| **Loro** | Performance-Champion wenn wir CRDT-Engine tauschen |
| **Yjs** | Größtes Ökosystem, Bindings |
| **p2panda-encryption** | Referenz für Group Encryption Design |

### Strategie

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Phase 1: Evolu-basierter POC (jetzt)                      │
│  • WotIdentity.deriveFrameworkKey() → Evolu Custom Keys    │
│  • Schema für Contacts, Verifications, Items               │
│  • Self-hosted Relay für Team                              │
│  • DID-Layer bereits vorhanden (WotIdentity)               │
│                                                             │
│  Phase 2: Team-Nutzung & Feedback                          │
│  • Kanban + Kalender Module (RLS Integration)              │
│  • Dogfooding durch Team                                    │
│  • Multi-Device Test (gleicher Seed, mehrere Geräte)       │
│                                                             │
│  Phase 3: Langfrist-Evaluation                              │
│  • NextGraph evaluieren (wenn JS SDK + Custom Keys)        │
│  • p2panda evaluieren (wenn Web SDK)                        │
│  • Ggf. Framework-Wechsel dank Adapter-Architektur         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Warum die Adapter-Architektur wichtig bleibt

Unsere framework-agnostische Schichtenarchitektur (WotStorage Interface) ermöglicht es, das Framework zu wechseln ohne die Business-Logik anzufassen. Falls NextGraph oder p2panda in 6-12 Monaten reif genug sind, können wir einen neuen Adapter schreiben und migrieren.

---

## Quellen

- [NextGraph](https://nextgraph.org/) - Decentralized, encrypted, local-first platform
- [Evolu](https://evolu.dev/) - Local-first platform with E2EE
- [Jazz](https://jazz.tools/) - Primitives for local-first apps
- [Secsync](https://github.com/nikgraf/secsync) - E2EE CRDT architecture
- [p2panda](https://p2panda.org/) - Modular P2P framework
- [DXOS](https://dxos.org/) - Decentralized developer platform
- [Keyhive](https://www.inkandswitch.com/keyhive/) - Group key management
- [Loro](https://loro.dev/) - High-performance CRDT library
- [Yjs](https://yjs.dev/) - Shared data types for collaboration
- [Automerge](https://automerge.org/) - JSON-like data structures that sync
- [Ossa Protocol](https://jamesparker.me/blog/post/2025/08/04/ossa-towards-the-next-generation-web) - Universal sync protocol
- [awesome-local-first](https://github.com/alexanderop/awesome-local-first) - Curated list

---

## Weiterführend

- [Sync-Protokoll](sync-protokoll.md) - Wie Offline-Änderungen synchronisiert werden
- [Verschlüsselung](verschluesselung.md) - E2E-Verschlüsselung im Detail
- [Datenmodell](../datenmodell/README.md) - Entitäten und ihre Beziehungen
