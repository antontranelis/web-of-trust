# Current Implementation

> **Hinweis:** Dies ist KEINE Spezifikation, sondern dokumentiert den aktuellen Implementierungsstand.
> Die Spezifikation findest du in [docs/flows/](./flows/) und anderen Spec-Dokumenten.

## Letzte Aktualisierung

**Datum:** 2026-03-15
**Phase:** Yjs Migration + CRDT-Benchmarks
**Demo:** https://web-of-trust.de/demo/
**Relay:** wss://relay.utopia-lab.org
**Profiles:** https://profiles.utopia-lab.org
**Benchmark:** https://web-of-trust.de/demo/benchmark

---

## Architektur-Überblick

### 7-Adapter Architektur (v2)

```
┌─────────────────────────────────────────────────────────┐
│                      Demo App (React)                    │
│  Hooks: useContacts, useProfile, useAttestations, ...   │
├─────────────────────────────────────────────────────────┤
│                    StorageAdapter                         │
│  AutomergeStorageAdapter | YjsStorageAdapter              │
├──────┬──────┬──────┬──────┬──────┬──────┬───────────────┤
│Storag│React.│Crypto│Discov│Messag│Replic│Authori-       │
│  e   │Storag│      │ery   │ing   │ation │zation         │
├──────┴──────┴──────┴──────┴──────┴──────┴───────────────┤
│              Infrastructure (CRDT-agnostisch)            │
│  Relay (WebSocket) │ Vault (HTTP) │ Profiles (HTTP)     │
└─────────────────────────────────────────────────────────┘
```

### CRDT-Wahl: Yjs (Default) + Automerge (Option)

**Yjs ist seit 2026-03-15 der Default-CRDT.** Automerge bleibt als Option (`VITE_CRDT=automerge`).

**Grund:** Automerge (Rust→WASM) blockiert den Main Thread auf Mobile:
- `repo.import()`: ~5s für 163KB auf Android (Vanadium)
- `Automerge.from()` Compaction: ~6.5s
- Gesamt: 30s+ UI-Freeze

**Yjs (pure JavaScript)** löst das Problem:
- 76x schneller Init auf Mobile (85ms vs 6.4s)
- 632x schneller bei Batch-Mutationen (3ms vs 1.9s)
- 69KB Bundle statt 1.7MB
- Eingebaute Garbage Collection (kein History-Strip-Hack nötig)
- In-Browser Benchmark: `/benchmark`

### Vier-Wege-Architektur

| Komponente | Zweck | CRDT-agnostisch? |
|---|---|---|
| **CompactStore** (IDB) | Lokale Snapshots | Ja — speichert Bytes |
| **Relay** (WebSocket) | Echtzeit-Sync | Ja — leitet Envelopes weiter |
| **Vault** (HTTP) | Encrypted Backup | Ja — speichert verschlüsselte Bytes |
| **wot-profiles** (HTTP) | Discovery | Ja — Profile-Server |

### Drei Sharing-Patterns

1. **Group Spaces** — CRDT-basierte Kollaboration (ReplicationAdapter)
2. **Selective Sharing** — Item-Keys für einzelne Elemente
3. **1:1 Delivery** — Attestationen, Verifications via Relay

---

## Identity System

### WotIdentity (`packages/wot-core/src/identity/WotIdentity.ts`)

- **BIP39 Mnemonic** — 12-Wort Recovery-Phrase (128-bit), deutsche Wortliste (dys2p/wordlists-de)
- **HKDF Master Key** — Non-extractable CryptoKey, Hardware-Isolation wenn verfügbar
- **Ed25519** — Signing (@noble/ed25519)
- **X25519** — Key Agreement (ECDH, separater HKDF-Pfad)
- **did:key** — Standard W3C Decentralized Identifier
- **JWS Signing** — `signJws()` für Profile, Capabilities
- **Encrypted Seed Storage** — PBKDF2 (600k) + AES-GCM in IndexedDB

```typescript
// API
create(passphrase, storeSeed): Promise<{ mnemonic, did }>
unlock(mnemonic, passphrase, storeSeed): Promise<void>
unlockFromStorage(passphrase): Promise<void>
sign(data): Promise<string>
signJws(payload): Promise<string>
getDid(): string
getPublicKeyMultibase(): Promise<string>
deriveFrameworkKey(info): Promise<Uint8Array>
```

### Multi-Device

Gleicher BIP39-Seed auf allen Geräten → gleiche DID, gleicher Key. Kein Login-Token, kein Server.

---

## Personal Document (PersonalDoc)

### Datenmodell

Das PersonalDoc speichert alle privaten Daten eines Users als CRDT-Dokument:

```typescript
PersonalDoc {
  profile:             { did, name, bio, avatar, ... }
  contacts:            { [did]: ContactDoc }
  verifications:       { [id]: VerificationDoc }
  attestations:        { [id]: AttestationDoc }
  attestationMetadata: { [id]: { accepted, deliveryStatus } }
  outbox:              { [id]: OutboxEntryDoc }
  spaces:              { [id]: SpaceMetadataDoc }
  groupKeys:           { [spaceId:gen]: GroupKeyDoc }
}
```

### Zwei Implementierungen

#### YjsPersonalDocManager (Default)

`packages/wot-core/src/storage/YjsPersonalDocManager.ts`

- **Pure JavaScript** — kein WASM, kein Worker nötig
- **Y.Doc** mit Y.Maps für jede Sub-Collection
- **Proxy-basierte API** — `doc.contacts[did] = {...}` funktioniert wie gewohnt
- **Eingebaute GC** — `ydoc.gc = true`, kein History-Strip, kein CompactionService
- **Serialisierung:** `Y.encodeStateAsUpdate()` → CompactStore (IDB)
- **Multi-Device Sync:** `YjsPersonalSyncAdapter` (verschlüsselte Updates via Relay)
- **Vault Integration:** Snapshot Push/Restore

#### PersonalDocManager (Automerge, Option)

`packages/wot-core/src/storage/PersonalDocManager.ts`

- **Rust→WASM** — Automerge.load(), Automerge.save()
- **CompactionService** — Zwei-Phasen-Save mit Yields (UI-Freeze reduziert)
- **Multi-Device Sync:** `PersonalNetworkAdapter` (automerge-repo Sync)
- **Vault Integration:** Snapshot Push/Restore

### Persistenz-Kette

```
App ändern → CRDT mutieren → CompactStore (IDB, sofort)
                            → Relay (verschlüsselt, sofort)
                            → Vault (verschlüsselt, 5s Debounce)
```

---

## Adapters

### 1. StorageAdapter + ReactiveStorageAdapter

Interface für CRUD auf Identity, Contacts, Verifications, Attestations.

**Implementierungen:**
- `AutomergeStorageAdapter` (Demo App) — nutzt PersonalDocManager
- `YjsStorageAdapter` (Demo App) — nutzt YjsPersonalDocManager

### 2. CryptoAdapter

`WebCryptoAdapter` — Ed25519 Sign/Verify, X25519 ECDH, AES-256-GCM Symmetric, HKDF.

### 3. DiscoveryAdapter

Öffentliche Profile finden und publizieren.

- `HttpDiscoveryAdapter` — HTTP REST gegen wot-profiles Server
- `OfflineFirstDiscoveryAdapter` — Cache-Wrapper mit Dirty-Flags

### 4. MessagingAdapter

Cross-User Messaging via WebSocket Relay.

- `WebSocketMessagingAdapter` — WebSocket Client, Heartbeat (Ping/Pong), **Message Buffer** (CRDT-agnostisch, buffert frühe Messages bevor Handler registriert)
- `OutboxMessagingAdapter` — Decorator, queued Messages bis Relay erreichbar
- `InMemoryMessagingAdapter` — Shared-Bus für Tests

### 5. ReplicationAdapter

CRDT-basierte Group Spaces mit E2EE.

- `AutomergeReplicationAdapter` — Automerge + EncryptedSyncService + GroupKeyService
- `YjsReplicationAdapter` — Yjs + EncryptedSyncService + GroupKeyService

Interface: `SpaceHandle<T>` mit `getDoc()`, `transact()`, `onRemoteUpdate()`, `close()`.

### 6. AuthorizationAdapter

UCAN-inspirierte Capabilities.

- `InMemoryAuthorizationAdapter` — für Tests/POC
- `crypto/capabilities.ts` — create, verify, delegate, extract. SignFn-Pattern (Private Key bleibt gekapselt).

### 7. SpaceMetadataStorage

Persistenz für Space-Infos und Group Keys.

- `IndexedDBSpaceMetadataStorage` — CRDT-agnostisch, eigene IDB
- `AutomergeSpaceMetadataStorage` — im PersonalDoc (Legacy)

---

## Services

### ProfileService
JWS-signierte Profile publizieren und verifizieren (`signProfile`, `verifyProfile`).

### EncryptedSyncService
Encrypt/Decrypt CRDT-Changes mit AES-256-GCM. CRDT-agnostisch.

### GroupKeyService
Group Key Management — Generierung, Rotation, Generationen. Pro Space ein Key.

### GraphCacheService
Batch Profile Resolution für Trust-Graph Visualisierung.

### AttestationDeliveryService
Attestation → verschlüsseln → via Messaging senden → Delivery Status tracken.

### VaultClient
HTTP Client für wot-vault Server (Snapshots, Changes, Info, Delete).

### VaultPushScheduler
5s-Debounce Push zum Vault. Dirty-Detection via injizierte `getHeadsFn`.

---

## Crypto

### Envelope Auth (`crypto/envelope-auth.ts`)
Ed25519-signierte Message-Envelopes. Sender-Authentifizierung für alle Relay-Messages.

### Capabilities (`crypto/capabilities.ts`)
UCAN-inspirierte Capability Tokens:
- `createCapability(issuer, audience, permissions, signFn)`
- `verifyCapability(token, issuerPublicKey)`
- `delegateCapability(parent, audience, permissions, signFn)`
- Offline-verifizierbar, delegierbar, attenuierbar

### Encoding (`crypto/encoding.ts`)
Base58, Base64Url, Multibase, `toBuffer()` Utility.

### DID (`crypto/did.ts`)
`createDid()`, `didToPublicKeyBytes()`, `isValidDid()`, `getDefaultDisplayName()`.

---

## Infrastructure

### wot-relay (`packages/wot-relay/`)

WebSocket Relay Server:
- **Message Forwarding** — DID-basiertes Routing
- **Delivery ACK** — Persistiert Messages bis Client ACK, Redelivery bei Reconnect
- **Multi-Device** — Mehrere Connections pro DID
- **Heartbeat** — Ping/Pong, tote Verbindungen erkennen
- **SQLite** — Message-Persistenz
- **Live:** `wss://relay.utopia-lab.org` (deployed by Anton)
- **Tests:** 24 Tests

### wot-vault (`packages/wot-vault/`)

Encrypted Document Store:
- **Append-only Change Log** + Snapshots
- **Auth via signierte Capability-Tokens**
- **HTTP REST:** POST/GET changes, PUT snapshot, GET info, DELETE doc
- **SQLite** — Persistenz
- **Port:** 8789
- **Tests:** 27 Tests

### wot-profiles (`packages/wot-profiles/`)

Public Profile Server:
- **HTTP REST:** GET/PUT `/p/{did}`, GET `/p/batch`
- **JWS Verification** — Standalone, keine wot-core Dependency
- **SQLite** — Persistenz
- **Live:** `https://profiles.utopia-lab.org`
- **Tests:** 25 Tests

---

## Demo App (`apps/demo/`)

### CRDT-Switch

```bash
pnpm dev:demo                    # Default: Yjs
VITE_CRDT=automerge pnpm dev:demo  # Automerge
```

Environment Variable `VITE_CRDT` steuert welcher StorageAdapter + PersonalDocManager geladen wird.

### Features

- **Onboarding** — Identity erstellen (Magische Wörter + Passphrase)
- **Recovery** — Identity aus Seed wiederherstellen
- **Unlock** — Passphrase-geschützter Login
- **QR-Verification** — In-Person Verification via Kamera
- **Kontakte** — Verifizierte Kontakte verwalten
- **Attestations** — Fähigkeiten/Eigenschaften attestieren, empfangen, veröffentlichen
- **Spaces** — Verschlüsselte Group Spaces (CRDT-Kollaboration)
- **Profile Sync** — JWS-signierte Profile auf wot-profiles publizieren
- **Public Profile** — Öffentliche Profilseite (auch ohne Login)
- **Multi-Device** — Sync via Relay + Vault
- **Offline-First** — Lokale Daten, Offline-Banner, Outbox
- **i18n** — Deutsch + Englisch
- **Dark Mode** — Vollständig unterstützt
- **Debug Panel** — Persistence-Metriken, Relay-Status, CRDT-Info
- **Benchmark** — In-Browser CRDT-Performance-Messung (`/benchmark`)

### Seiten

| Route | Seite |
|---|---|
| `/` | Home (Stats, Quick Actions) |
| `/identity` | Identity Management |
| `/verify` | QR-Verification |
| `/contacts` | Kontaktliste |
| `/attestations` | Attestations |
| `/spaces` | Group Spaces |
| `/spaces/:id` | Space Detail |
| `/profile/:did` | Public Profile |
| `/benchmark` | CRDT-Benchmark |

### E2E Tests (Playwright)

7 E2E-Tests, alle grün mit **beiden** CRDT-Adaptern:

1. **Onboarding** — Generate → Verify → Profile → Protect → Complete
2. **Unlock** — Reload → Passphrase → Logged In
3. **Seed Restore** — Same DID on new device
4. **QR Verification** — Alice and Bob verify each other
5. **Attestation Flow** — Alice attests Bob → Bob publishes → visible on public profile
6. **Multi-Device Sync** — Alice on 2 devices + Bob: personal-doc sync, message routing, space sync
7. **Spaces** — Create space, invite member, shared notes with CRDT merge, remove member

---

## Tests

### Übersicht

| Package | Tests | Vitest |
|---|---|---|
| wot-core | 392 | 4.1.0 |
| wot-relay | 24 | 4.1.0 |
| wot-vault | 27 | 4.1.0 |
| wot-profiles | 25 | 4.1.0 |
| Demo (Unit) | 59 | 4.1.0 |
| Demo (E2E) | 7 | Playwright |
| **Gesamt** | **534** | |

### wot-core Test-Dateien (29)

```
tests/
├── WotIdentity.test.ts                    # Identity, Signing, JWS
├── SeedStorage.test.ts                    # Encrypted Seed Persistence
├── VerificationIntegration.test.ts        # Challenge-Response E2E
├── VerificationRelay.test.ts              # Verification via Relay
├── VerificationStorage.test.ts            # Verification Persistence
├── OnboardingFlow.test.ts                 # Full Onboarding Flow
├── MessagingAdapter.test.ts               # WebSocket + InMemory
├── EncryptedMessagingNetworkAdapter.test.ts # Encrypted Peer Sync
├── OutboxMessagingAdapter.test.ts         # Offline Queue
├── ProfileService.test.ts                # JWS Profile Sign/Verify
├── SymmetricCrypto.test.ts               # AES-256-GCM
├── AsymmetricCrypto.test.ts              # X25519 ECIES
├── EncryptedSyncService.test.ts          # Encrypt/Decrypt CRDT Changes
├── GroupKeyService.test.ts               # Group Key Management
├── GraphCacheService.test.ts             # Batch Profile Resolution
├── AutomergeReplication.test.ts          # Automerge Spaces + E2EE
├── CompactStorageManager.test.ts         # IDB Snapshot Storage
├── SyncOnlyStorageAdapter.test.ts        # Sync State Storage
├── VaultIntegration.test.ts             # Vault Push/Restore
├── VaultPushScheduler.test.ts           # Debounced Vault Push
├── OfflineFirstDiscoveryAdapter.test.ts  # Offline Cache
├── Capabilities.test.ts                 # UCAN-like Capabilities
├── EnvelopeAuth.test.ts                 # Signed Envelopes
├── ResourceRef.test.ts                  # ResourceRef branded types
├── CrdtBenchmark.test.ts               # Automerge vs Yjs Performance
├── YjsPersonalDocManager.test.ts        # Yjs CRUD + Proxy + Persistence
├── YjsPersonalSync.test.ts             # Yjs Multi-Device Sync
├── YjsVaultIntegration.test.ts          # Yjs Vault Push/Restore
└── setup.ts                             # fake-indexeddb setup
```

---

## File Structure

### wot-core Package

```
packages/wot-core/src/
├── identity/
│   ├── WotIdentity.ts              # Ed25519 + X25519 + JWS + HKDF
│   └── SeedStorage.ts              # Encrypted seed in IndexedDB
├── verification/
│   └── VerificationHelper.ts       # Challenge-Response-Protokoll
├── crypto/
│   ├── did.ts                      # DID utilities
│   ├── encoding.ts                 # Base64/Multibase
│   ├── jws.ts                      # JWS signing/verification
│   ├── capabilities.ts             # UCAN-inspired capabilities
│   └── envelope-auth.ts            # Signed message envelopes
├── adapters/
│   ├── interfaces/                 # 12 Adapter Interfaces
│   │   ├── StorageAdapter.ts
│   │   ├── ReactiveStorageAdapter.ts
│   │   ├── CryptoAdapter.ts
│   │   ├── MessagingAdapter.ts
│   │   ├── DiscoveryAdapter.ts
│   │   ├── ReplicationAdapter.ts   # SpaceHandle<T>
│   │   ├── AuthorizationAdapter.ts
│   │   ├── OutboxStore.ts
│   │   ├── SpaceMetadataStorage.ts
│   │   ├── GraphCacheStore.ts
│   │   ├── PublishStateStore.ts
│   │   └── Subscribable.ts
│   ├── crypto/
│   │   └── WebCryptoAdapter.ts     # Ed25519 + X25519 + AES-256-GCM
│   ├── messaging/
│   │   ├── WebSocketMessagingAdapter.ts  # + Heartbeat + Message Buffer
│   │   ├── OutboxMessagingAdapter.ts     # Offline-Queue Decorator
│   │   ├── AutomergeOutboxStore.ts
│   │   ├── InMemoryMessagingAdapter.ts
│   │   └── InMemoryOutboxStore.ts
│   ├── discovery/
│   │   ├── HttpDiscoveryAdapter.ts
│   │   ├── OfflineFirstDiscoveryAdapter.ts
│   │   ├── InMemoryGraphCacheStore.ts
│   │   └── InMemoryPublishStateStore.ts
│   ├── replication/
│   │   ├── AutomergeReplicationAdapter.ts
│   │   ├── YjsReplicationAdapter.ts
│   │   ├── YjsPersonalSyncAdapter.ts
│   │   ├── PersonalNetworkAdapter.ts
│   │   └── EncryptedMessagingNetworkAdapter.ts
│   ├── storage/
│   │   ├── IndexedDBSpaceMetadataStorage.ts
│   │   ├── AutomergeSpaceMetadataStorage.ts
│   │   ├── InMemorySpaceMetadataStorage.ts
│   │   ├── InMemoryCompactStore.ts
│   │   ├── InMemoryRepoStorageAdapter.ts
│   │   └── LocalStorageAdapter.ts
│   └── authorization/
│       └── InMemoryAuthorizationAdapter.ts
├── services/
│   ├── ProfileService.ts           # JWS Profile Sign/Verify
│   ├── EncryptedSyncService.ts     # Encrypt/Decrypt CRDT Changes
│   ├── GroupKeyService.ts          # Group Key Management
│   ├── GraphCacheService.ts        # Batch Profile Resolution
│   ├── AttestationDeliveryService.ts
│   ├── VaultClient.ts             # HTTP Client for wot-vault
│   └── VaultPushScheduler.ts      # Debounced Vault Push
├── storage/
│   ├── YjsPersonalDocManager.ts    # Yjs CRDT (Default)
│   ├── PersonalDocManager.ts       # Automerge CRDT (Option)
│   ├── CompactStorageManager.ts    # IDB Snapshot Storage
│   ├── CompactionService.ts        # Automerge History-Strip (Yields)
│   ├── SyncOnlyStorageAdapter.ts   # Automerge Sync States
│   └── PersistenceMetrics.ts       # Debug Metrics
├── types/                          # Domain Types
│   ├── identity.ts, contact.ts, verification.ts
│   ├── attestation.ts, proof.ts, messaging.ts
│   ├── space.ts, resource-ref.ts
│   └── index.ts
├── wordlists/
│   └── german-positive.ts          # 2048 deutsche BIP39-Wörter
└── index.ts                        # 100+ Exports
```

### Demo App

```
apps/demo/src/
├── adapters/
│   ├── AutomergeStorageAdapter.ts   # Automerge PersonalDoc Adapter
│   ├── YjsStorageAdapter.ts        # Yjs PersonalDoc Adapter
│   ├── AutomergeGraphCacheStore.ts
│   ├── AutomergeOutboxStore.ts
│   ├── AutomergePublishStateStore.ts
│   ├── AutomergeSpaceMetadataStorage.ts
│   ├── LocalCacheStore.ts
│   └── PersonalNetworkAdapter.ts
├── context/
│   ├── AdapterContext.tsx           # CRDT Switch + alle Adapter init
│   ├── IdentityContext.tsx
│   └── PendingVerificationContext.tsx
├── hooks/                          # 14 React Hooks
├── pages/                          # 9 Seiten + Benchmark
├── components/                     # UI Components
│   ├── identity/                   # Onboarding, Recovery, Unlock
│   ├── verification/               # QR-Code, Confetti
│   ├── contacts/                   # ContactCard, ContactList
│   ├── attestation/                # AttestationCard, Create, Import
│   ├── debug/                      # DebugPanel
│   ├── shared/                     # Avatar, Tooltip, etc.
│   └── layout/                     # AppShell, Navigation
├── services/                       # Verification, Contact, Attestation
├── i18n/                           # Deutsch + Englisch
├── personalDocManager.ts           # CRDT-Switch Shim
├── App.tsx
└── main.tsx
```

---

## Technische Entscheidungen

### DID: did:key (bestätigt)

Nach Evaluation von 6 Methoden (did:key, did:peer, did:web, did:webvh, did:dht, did:plc). Keine Infrastruktur nötig, offline-fähig, BIP39→deterministic DID.

### CRDT: Yjs Default, Automerge Option

**Entscheidung (2026-03-15):** Yjs ist Default nach umfangreicher Evaluierung.

**Geschichte:**
1. Evolu (SQLite WASM) — erste Iteration, entfernt wegen Einschränkungen
2. Automerge (Rust WASM) — zweite Iteration, WASM-Performance auf Mobile unhaltbar
3. Yjs (pure JavaScript) — aktuelle Lösung, 76x schneller auf Mobile

**Benchmark-Ergebnisse (Large: 500 Kontakte, 1000 Attestations):**

| Metrik | Yjs | Automerge | Speedup |
|---|---|---|---|
| Init (Android) | 85ms | 6.4s | 76x |
| Mutate 100 | 3ms | 1.9s | 632x |
| Serialize | 112ms | 819ms | 7x |
| Bundle | 69KB | 1.7MB | 25x |

### Crypto: WebCrypto API + @noble/ed25519

Native WebCrypto für HKDF, PBKDF2, AES-GCM, X25519 ECDH. @noble/ed25519 für Signing (WebCrypto Ed25519 hat Browser-Kompatibilitätsprobleme).

### Storage: IndexedDB via CompactStorageManager

Eigener CompactStorageManager statt automerge-repo (das bei 40+ IDB-Chunks WASM OOM verursachte).

### Encryption: Encrypt-then-sync

CRDT-Updates werden **vor** dem Sync verschlüsselt. Der Relay sieht nur Ciphertext. Inspiriert von Keyhive/NextGraph.

---

## Unterschiede zur Spezifikation

| Aspekt | Spezifikation | Implementiert | Grund |
|---|---|---|---|
| DID Format | `did:wot:...` | `did:key:z6Mk...` | W3C-Standard, keine eigene Infra |
| Master Key | BIP39→PBKDF2→Ed25519 | BIP39→HKDF (non-extractable) | Hardware-Isolation, Framework-Key-Derivation |
| Wortliste | Englisch | Deutsch (dys2p) | Deutschsprachige Zielgruppe |
| Mnemonic | 24 Wörter | 12 Wörter | 128-bit reicht, bessere UX |
| Storage | Nicht spezifiziert | Passphrase + IndexedDB | Browser hat keine OS-Keychain |

---

## Nächste Schritte

### Priorität 1: Offline E2E-Tests

19 geplante Szenarien:
- Offline-Start, Offline-Aktionen (Profil, Attestation, Space, Verification)
- Reconnect-Sync, Eingehende Messages während Offline
- Tab schließen + wiederkommen, Vault-Fallback
- Verification in der Höhle (beide offline, QR-Scan)
- Seed-Restore offline → Vault-Merge bei Reconnect

### Priorität 2: WoT Connector für Real Life Stack

`real-life-stack/packages/wot-connector/` — Integration mit Yjs-Adapter, CompactStore, neue Architektur.

### Priorität 3: CRDT Adapter Library

Austauschbare CRDT-Packages für externe Entwickler:
```
@real-life/wot-core           → Interfaces, Crypto, Identity
@real-life/adapter-yjs        → YjsReplicationAdapter (Default)
@real-life/adapter-automerge  → AutomergeReplicationAdapter (Option)
```

### Zurückgestellt

- **Matrix Integration** — Erst wenn Federation nötig
- **Social Recovery (Shamir)** — Seed-Backup über verifizierte Kontakte
- **NextGraph Evaluation** — Telefonat mit Nicos (Maintainer) ausstehend
- **Keyhive/BeeKEM** — Frühestens Ende 2027 produktionsreif

---

## Architektur-Entscheidungen (Forschung)

### Framework Evaluation v2 (2026-02-08)

16 Frameworks evaluiert, 6 eliminiert:
- Eliminiert: ActivityPub (no E2EE), Nostr (secp256k1), DXOS (P-256), DIDComm (stale), Iroh (networking only), p2panda (no JS)
- Best CRDT: Yjs (gewählt nach Automerge-Performance-Problemen)
- Best Messaging: Matrix (Ed25519, Megolm, Federation) — für Produktion
- Best Capabilities: Willow/Meadowcap (Inspiration)

### CRDT Evaluation (2026-03-15)

| CRDT | Sprache | Bundle | Mobile Init (163KB) | E2EE | Status |
|---|---|---|---|---|---|
| **Yjs** | Pure JS | 69KB | ~85ms | Selbst gebaut | **Default** |
| Automerge | Rust→WASM | 1.7MB | ~6.4s | Keyhive (2027?) | Option |
| NextGraph | Rust→WASM | ~7.9MB | ? | Eingebaut | Alpha |
| Loro | Rust→WASM | ~500KB | ? | Nein | Neu |

### Vault Sync Patterns

Drei Patterns dokumentiert (`docs/konzepte/vault-sync-architektur.md`):
1. **Peer-Sync** — Inkrementell via Relay
2. **Vault** — Snapshot-Replace, 5s Debounce
3. **Invite** — Snapshot bei Space-Einladung

---

*Dieses Dokument wird bei signifikanten Änderungen aktualisiert.*
*Letzte Änderung: Yjs Migration (2026-03-15)*
