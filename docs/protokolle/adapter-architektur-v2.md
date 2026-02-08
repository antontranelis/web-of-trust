# Adapter-Architektur v2

> 6 Adapter-Interfaces für das Web of Trust Ecosystem
>
> Erstellt: 2026-02-08 | Basiert auf [Framework-Evaluation v2](framework-evaluation.md)

## Motivation

Die v1-Architektur hatte 3 Adapter (StorageAdapter, ReactiveStorageAdapter, CryptoAdapter).
Diese decken lokale Persistenz und Kryptografie ab, aber nicht:

- **Cross-User Messaging** — Attestations, Verifications und Items zwischen DIDs zustellen
- **CRDT Replication** — Gemeinsame Spaces (Kanban, Kalender) mit mehreren Nutzern
- **Capability-basierte Autorisierung** — Wer darf was lesen/schreiben/delegieren?

### Zentrale Erkenntnis: Zwei orthogonale Achsen

```
                    ┌─────────────────────────────────────┐
                    │         CRDT / Sync                  │
                    │   (Zustandskonvergenz)               │
                    │                                      │
                    │   "Wie konvergiert der Zustand       │
                    │    über Geräte und Nutzer?"           │
                    │                                      │
                    │   → ReplicationAdapter               │
                    └─────────────────────────────────────┘
                                    │
                                    │  orthogonal
                                    │
                    ┌─────────────────────────────────────┐
                    │         Messaging                    │
                    │   (Zustellung zwischen DIDs)         │
                    │                                      │
                    │   "Wie erreicht eine Nachricht       │
                    │    den Empfänger?"                    │
                    │                                      │
                    │   → MessagingAdapter                 │
                    └─────────────────────────────────────┘

Eine Nachricht enthält NICHT den Zustand, sondern nur den Trigger/Pointer.
Der Zustand lebt im CRDT und konvergiert unabhängig.
```

---

## Übersicht: 6 Adapter

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WoT Domain Layer                             │
│  Identity, Contact, Verification, Attestation, Item, Group          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │  StorageAdapter    │  │  CryptoAdapter    │  │  Reactive-     │  │
│  │  (lokale           │  │  (Signing,        │  │  Storage-      │  │
│  │   Persistenz)      │  │   Encryption,     │  │  Adapter       │  │
│  │                    │  │   DID, Mnemonic)  │  │  (Live Queries)│  │
│  │  v1, implementiert │  │  v1, implementiert│  │  v1, impl.     │  │
│  └───────────────────┘  └───────────────────┘  └────────────────┘  │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │  MessagingAdapter  │  │  Replication-     │  │  Authorization-│  │
│  │  (Cross-User       │  │  Adapter          │  │  Adapter       │  │
│  │   Delivery)        │  │  (CRDT Sync +     │  │  (UCAN-like    │  │
│  │                    │  │   Spaces)         │  │   Capabilities)│  │
│  │  v2, NEU           │  │  v2, NEU          │  │  v2, NEU       │  │
│  └───────────────────┘  └───────────────────┘  └────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bestehende Adapter (v1, implementiert)

Diese Interfaces sind bereits in `packages/wot-core/src/adapters/interfaces/` definiert
und haben funktionierende Implementierungen. Der CryptoAdapter wird um `generateSymmetricKey`
erweitert (v2); StorageAdapter und ReactiveStorageAdapter bleiben unverändert.

### StorageAdapter

Lokale Persistenz für alle WoT-Entitäten. Folgt dem Empfänger-Prinzip.

**Datei:** `packages/wot-core/src/adapters/interfaces/StorageAdapter.ts`
**Implementierung:** `EvoluStorageAdapter` (Demo-App)

```typescript
interface StorageAdapter {
  // Identity (lokal, nie synchronisiert)
  createIdentity(did: string, profile: Profile): Promise<Identity>
  getIdentity(): Promise<Identity | null>
  updateIdentity(identity: Identity): Promise<void>

  // Contacts
  addContact(contact: Contact): Promise<void>
  getContacts(): Promise<Contact[]>
  getContact(did: string): Promise<Contact | null>
  updateContact(contact: Contact): Promise<void>
  removeContact(did: string): Promise<void>

  // Verifications (Empfänger-Prinzip)
  saveVerification(verification: Verification): Promise<void>
  getReceivedVerifications(): Promise<Verification[]>
  getVerification(id: string): Promise<Verification | null>

  // Attestations (Empfänger-Prinzip)
  saveAttestation(attestation: Attestation): Promise<void>
  getReceivedAttestations(): Promise<Attestation[]>
  getAttestation(id: string): Promise<Attestation | null>

  // Attestation Metadata (lokal, nicht signiert)
  getAttestationMetadata(attestationId: string): Promise<AttestationMetadata | null>
  setAttestationAccepted(attestationId: string, accepted: boolean): Promise<void>

  // Lifecycle
  init(): Promise<void>
  clear(): Promise<void>
}
```

### ReactiveStorageAdapter

Reaktive Erweiterung für Backends mit Live Queries. Mapped auf React's `useSyncExternalStore`.

**Datei:** `packages/wot-core/src/adapters/interfaces/ReactiveStorageAdapter.ts`

```typescript
interface Subscribable<T> {
  subscribe(callback: (value: T) => void): () => void
  getValue(): T
}

interface ReactiveStorageAdapter {
  watchContacts(): Subscribable<Contact[]>
  watchReceivedVerifications(): Subscribable<Verification[]>
  watchReceivedAttestations(): Subscribable<Attestation[]>
}
```

### CryptoAdapter

Alle kryptografischen Operationen. Framework-agnostisch.

**Datei:** `packages/wot-core/src/adapters/interfaces/CryptoAdapter.ts`
**Implementierung:** `WebCryptoAdapter` (noble/ed25519 + Web Crypto API)

```typescript
interface CryptoAdapter {
  // Key Management
  generateKeyPair(): Promise<KeyPair>
  exportKeyPair(keyPair: KeyPair): Promise<{ publicKey: string; privateKey: string }>
  importKeyPair(exported: { publicKey: string; privateKey: string }): Promise<KeyPair>
  exportPublicKey(publicKey: CryptoKey): Promise<string>
  importPublicKey(exported: string): Promise<CryptoKey>

  // Mnemonic / Recovery
  generateMnemonic(): string
  deriveKeyPairFromMnemonic(mnemonic: string): Promise<KeyPair>
  validateMnemonic(mnemonic: string): boolean

  // DID (did:key mit Ed25519)
  createDid(publicKey: CryptoKey): Promise<string>
  didToPublicKey(did: string): Promise<CryptoKey>

  // Signing (Ed25519)
  sign(data: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array>
  verify(data: Uint8Array, signature: Uint8Array, publicKey: CryptoKey): Promise<boolean>
  signString(data: string, privateKey: CryptoKey): Promise<string>
  verifyString(data: string, signature: string, publicKey: CryptoKey): Promise<boolean>

  // Encryption (X25519 + AES-256-GCM)
  encrypt(plaintext: Uint8Array, recipientPublicKey: Uint8Array): Promise<EncryptedPayload>
  decrypt(payload: EncryptedPayload, privateKey: Uint8Array): Promise<Uint8Array>

  // Symmetric Key Generation (NEU in v2 — für Item-Keys und Group-Keys)
  generateSymmetricKey(): Promise<Uint8Array>  // AES-256-GCM, 32 bytes

  // Symmetric Encryption (für Items und Spaces)
  encryptSymmetric(plaintext: Uint8Array, key: Uint8Array): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }>
  decryptSymmetric(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Promise<Uint8Array>

  // Utilities
  generateNonce(): string
  hashData(data: Uint8Array): Promise<Uint8Array>
}
```

> **v2-Erweiterung:** `generateSymmetricKey` + `encryptSymmetric`/`decryptSymmetric` werden
> in den Interaction-Flows für Item-Keys und Group-Keys genutzt. Die bestehende
> `encrypt`/`decrypt` (asymmetrisch, X25519) bleibt für 1:1 E2EE.

---

## ResourceRef: Standardisiertes Pointer-Format

Nachrichten enthalten NICHT den Zustand, sondern nur einen Pointer (Trigger).
Capabilities adressieren Resources. Beides braucht ein einheitliches URI-Format.

```typescript
// ResourceRef ist ein URI-String mit dem Schema "wot:"
type ResourceRef = string

// Format: wot:<type>:<id>[/<sub-path>]
//
// Beispiele:
//   wot:attestation:abc-123
//   wot:verification:def-456
//   wot:space:wg-kalender
//   wot:space:wg-kalender/item/event-789
//   wot:space:wg-kalender/module/kanban
//   wot:contact:did:key:z6Mk...
//
// Regeln:
// - Immer "wot:" Prefix
// - <type> ist einer der bekannten Entitätstypen
// - <id> ist die Entity-ID oder Space-ID
// - Sub-Pfade für Items innerhalb von Spaces
// - Capabilities können Wildcards nutzen: wot:space:abc/*

// Bekannte Resource-Types:
type ResourceType =
  | 'attestation'
  | 'verification'
  | 'contact'
  | 'space'
  | 'item'

// Helper (Implementierung in wot-core)
function createResourceRef(type: ResourceType, id: string, subPath?: string): ResourceRef {
  return subPath ? `wot:${type}:${id}/${subPath}` : `wot:${type}:${id}`
}

function parseResourceRef(ref: ResourceRef): { type: ResourceType; id: string; subPath?: string } {
  // Parse wot:<type>:<id>[/<sub-path>]
}
```

**Warum ein eigenes URI-Format?**
- DIDs adressieren Identitäten, ResourceRefs adressieren Daten
- Capabilities brauchen eindeutige Resource-Identifier
- Messages referenzieren Ressourcen (z.B. "Item-Key für wot:space:abc/item/123")
- Konsistenz über alle Adapter hinweg

---

## Neue Adapter (v2)

### MessagingAdapter

Cross-User Delivery zwischen DIDs. Zuständig für:
- Attestation/Verification Zustellung (Empfänger-Prinzip)
- Item-Key Delivery (selektive Sichtbarkeit)
- Contact Requests
- Space-Einladungen und Group Key Rotation
- Beliebige DID-zu-DID Nachrichten

**Designprinzipien:**
- Adressierung über DIDs (nicht Server-IDs, nicht Pubkeys)
- Nachrichten als signierte Envelopes (Signatur getrennt vom Payload)
- Mehrstufige Delivery Receipts (accepted → delivered → acknowledged)
- Offline-Queue: Nachrichten warten auf den Empfänger
- Transport-Resolution getrennt vom Messaging-Concern

```typescript
// Message Types die das WoT braucht
type MessageType =
  | 'verification'         // "Ich verifiziere dich" (QR-Code Austausch)
  | 'attestation'          // "Ich attestiere dir X" (Empfänger-Prinzip)
  | 'contact-request'      // "Ich möchte dich als Kontakt"
  | 'item-key'             // "Hier ist der Schlüssel für Item X" (selektiv)
  | 'space-invite'         // "Tritt diesem Space bei" (mit Group Key)
  | 'group-key-rotation'   // "Neuer Group Key für Space X"
  | 'ack'                  // "Nachricht verarbeitet" (Application-Level)
  | 'content'              // Generischer Payload

// Standardisiertes Envelope-Format für alle Nachrichten.
// Signatur ist getrennt vom Payload → unabhängig verifizierbar.
interface MessageEnvelope {
  v: 1                     // Protokoll-Version
  id: string               // UUID
  type: MessageType
  fromDid: string
  toDid: string
  createdAt: string        // ISO 8601
  encoding: 'json' | 'cbor' | 'base64'
  payload: string          // Encoded Payload (je nach encoding)
  signature: string        // Ed25519 Signatur über kanonische Felder
  ref?: ResourceRef        // Optionaler Pointer auf die Ressource (siehe ResourceRef)
}

// Mehrstufige Delivery Receipts:
// - accepted: Relay hat die Nachricht angenommen
// - delivered: Empfänger-Device hat sie empfangen
// - acknowledged: Empfänger-App hat sie verarbeitet (z.B. Attestation gespeichert)
interface DeliveryReceipt {
  messageId: string
  status: 'accepted' | 'delivered' | 'acknowledged' | 'failed'
  timestamp: string
  reason?: string          // Bei 'failed': Fehlergrund
}

type MessagingState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface MessagingAdapter {
  // Connection Lifecycle
  connect(myDid: string): Promise<void>
  disconnect(): Promise<void>
  getState(): MessagingState

  // Sending — nimmt ein Envelope entgegen, gibt Receipt zurück
  send(envelope: MessageEnvelope): Promise<DeliveryReceipt>

  // Receiving — Callback erhält verifiziertes Envelope
  onMessage(callback: (envelope: MessageEnvelope) => void): () => void

  // Receipt Updates (async: delivered/acknowledged kommen später)
  onReceipt(callback: (receipt: DeliveryReceipt) => void): () => void

  // Transport Resolution (wie findet man den Empfänger?)
  // Bewusst getrennt vom DID-Konzept: hier geht es um Transport-Adressen,
  // nicht um DID-Resolution. Bei Matrix-Migration wird das zu Room-IDs.
  registerTransport(did: string, transportAddress: string): Promise<void>
  resolveTransport(did: string): Promise<string | null>
}
```

> **Hinweis:** `registerTransport`/`resolveTransport` sind Transport-Concerns, keine
> DID-Resolution. In der Matrix-Implementierung wird `transportAddress` eine Room-ID,
> beim Custom WS Relay eine WebSocket-URL. Langfristig könnte ein separater
> `DidResolverAdapter` sinnvoll werden (DID Document → Service Endpoints).

**POC-Implementierung:** Custom WebSocket Relay

```
Client A ───WebSocket──→ Relay Server ←──WebSocket─── Client B
                           │
                           ├── DID → WebSocket Mapping
                           ├── Offline Queue (messages warten)
                           └── Kein Zugriff auf Payload (E2EE)

Relay ist:
- Stateless (kennt nur DID → Connection Mapping)
- Self-hostable (Node.js, ein Dutzend Zeilen)
- Blind (Payload ist E2E-verschlüsselt)
```

**Langfrist-Implementierung:** Matrix

```
Client A ───HTTPS──→ Homeserver A ←──Federation──→ Homeserver B ←── Client B
                         │                              │
                         └──── DID-mapped Rooms ────────┘

Vorteile gegenüber Custom WS:
- Megolm für Gruppen-E2EE (auditiert)
- Federation (kein Single Point of Failure)
- Bridges zu Signal, Slack, etc.
- Key Verification (Emoji/QR Cross-Signing)
```

---

### ReplicationAdapter

CRDT Sync für Multi-Device und Multi-User Spaces. Zuständig für:
- Personal Space: Eigene Daten über Geräte synchronisieren
- Shared Spaces: Gemeinsame Daten (Kanban, Kalender, Karte) in Gruppen

**Designprinzipien:**
- Spaces als Container für kollaborative Daten
- SpaceHandle als Zugriffs-API (abstrahiert CRDT-Engine)
- Membership-Management (wer ist in welchem Space?)
- Zustand konvergiert automatisch (CRDTs)
- Unabhängig von Messaging (orthogonale Achse)
- Events wenn Remote-State ankommt (UI weiß wann refetchen)

**Boundary zu StorageAdapter:**
- StorageAdapter = lokale Persistenz (Contacts, Verifications, Attestations, Identity)
- ReplicationAdapter = CRDT State + Sync (Space-Daten: Kanban-Tasks, Events, etc.)
- App spricht Domain-Commands über SpaceHandle
- ReplicationAdapter managed CRDT-Doc + Sync intern
- StorageAdapter kann Snapshots persistieren (z.B. für Offline-Startup)

```typescript
type ReplicationState = 'idle' | 'syncing' | 'error'

interface SpaceInfo {
  id: string
  type: 'personal' | 'shared'
  members: string[]          // DIDs der Mitglieder
  createdAt: string
}

interface SpaceMemberChange {
  spaceId: string
  did: string
  action: 'added' | 'removed'
}

// SpaceHandle abstrahiert den Zugriff auf den CRDT-State eines Space.
// Bei Automerge wäre das ein Automerge-Doc Handle,
// bei Evolu ein Evolu-Query-Kontext.
interface SpaceHandle {
  id: string
  info(): SpaceInfo

  // Transaktionale Änderungen am Space-State
  // Die konkrete Implementierung bestimmt das Schema (Automerge Doc, Evolu Table, etc.)
  transact<T>(fn: (doc: unknown) => T): T

  // Event: neuer Remote-State angekommen (UI soll refetchen)
  onRemoteUpdate(callback: () => void): () => void

  // Lifecycle
  close(): void
}

interface ReplicationAdapter {
  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  getState(): ReplicationState
  onStateChange(callback: (state: ReplicationState) => void): () => void

  // Space Management
  createSpace(type: 'personal' | 'shared'): Promise<SpaceInfo>
  joinSpace(spaceId: string, inviteToken: string): Promise<SpaceInfo>
  leaveSpace(spaceId: string): Promise<void>
  getSpaces(): Promise<SpaceInfo[]>
  getSpace(spaceId: string): Promise<SpaceInfo | null>

  // Space Access — öffnet einen Handle für Lesen/Schreiben
  openSpace(spaceId: string): Promise<SpaceHandle>

  // Membership
  addMember(spaceId: string, memberDid: string): Promise<void>
  removeMember(spaceId: string, memberDid: string): Promise<void>
  onMemberChange(callback: (change: SpaceMemberChange) => void): () => void

  // Sync
  syncNow(spaceId?: string): Promise<void>

  // Event: irgendein Space hat Remote-Updates bekommen
  onSpaceUpdated(callback: (spaceId: string) => void): () => void
}
```

**POC-Implementierung:** Evolu (Single-Owner = Personal Space only)

```
Evolu synct aktuell nur innerhalb desselben Owners:
- Personal Space: ✅ (Multi-Device via Evolu Relay)
- Shared Spaces: ❌ (SharedOwner nicht funktional)

Für den POC reicht Personal Space.
Shared Spaces kommen in Phase 3.
```

**Langfrist-Implementierung:** Automerge

```
Automerge-Dokument pro Space:
- Jeder Space = ein Automerge Doc
- Members synchronisieren via Automerge Sync Protocol
- Group Key encrypts das Automerge Doc
- Bei Member-Removal: Key Rotation

Automerge ist empfohlen weil:
- Bewährtes CRDT (Ink & Switch)
- JSON-like API (einfach für Module)
- automerge-repo für Networking
```

---

### AuthorizationAdapter

UCAN-ähnliches Capability-System. Zuständig für:
- Wer darf was in welchem Space?
- Delegierbare, einschränkbare Berechtigungen
- Read/Write/Delete/Delegate Granularität

**Designprinzipien:**
- Capabilities sind signierte Tokens (wie UCANs)
- Jede Delegation kann nur einschränken, nie erweitern (Attenuation)
- Proof Chains: Alice → Bob → Carl (nachvollziehbar)
- Offline-verifizierbar (keine zentrale Autorität)
- Inspiriert von Willow/Meadowcap und UCAN
- Resources adressiert über ResourceRef (standardisiertes URI-Format)
- Expiration wird im POC ernst genommen (keine ewigen Tokens)

**Revocation-Strategie:**

Revocation ist der schwierigste Teil bei offline-verifizierbaren Capabilities.
Die Truth-Source für Revocation ist **der Space selbst** (via CRDT):

```
Stufen:
1. POC:     Nur Expiration (kein aktives Revoke nötig)
2. Phase 2: Revocation List pro Space (im CRDT State)
3. Phase 3: Bloom-Filter für effiziente Prüfung über viele Spaces
4. Phase 4: CRL-ähnliches Gossip über MessagingAdapter
```

```typescript
type Permission = 'read' | 'write' | 'delete' | 'delegate'

interface Capability {
  id: string
  issuer: string           // DID des Ausstellers
  audience: string         // DID des Empfängers
  resource: ResourceRef    // Standardisierte Resource-Referenz
  permissions: Permission[]
  expiration: string       // ISO 8601 — Pflichtfeld! Keine ewigen Tokens.
  proof?: string           // ID der Parent-Capability (für Delegation)
  signature: string        // Ed25519 Signatur des Issuers
}

// Kontext für Verification — ermöglicht Revocation-Check
interface VerificationContext {
  spaceId?: string         // Für Space-scoped Revocation Lists
  checkRevocation?: boolean // Default: true
  now?: string             // Override für Tests (ISO 8601)
}

interface AuthorizationAdapter {
  // Granting
  grant(
    resource: ResourceRef,
    toDid: string,
    permissions: Permission[],
    expiration: string       // ISO 8601 — Pflicht
  ): Promise<Capability>

  // Revoking — schreibt in die Revocation List des zugehörigen Space
  revoke(capabilityId: string): Promise<void>

  // Delegation (Attenuation: kann nur einschränken)
  delegate(
    parentCapabilityId: string,
    toDid: string,
    permissions: Permission[],  // Subset der Parent-Permissions
    expiration?: string         // Muss <= Parent-Expiration sein
  ): Promise<Capability>

  // Verification — prüft Signatur, Expiration, Chain UND Revocation
  verify(
    capability: Capability,
    context?: VerificationContext
  ): Promise<boolean>
  getCapabilityChain(capabilityId: string): Promise<Capability[]>

  // Querying
  getMyCapabilities(resource?: ResourceRef): Promise<Capability[]>
  getGrantedCapabilities(resource?: ResourceRef): Promise<Capability[]>
  canAccess(
    did: string,
    resource: ResourceRef,
    permission: Permission,
    context?: VerificationContext
  ): Promise<boolean>
}
```

**Beispiel: Delegation Chain**

```
1. Alice erstellt Space "WG-Kalender"
   → Alice hat automatisch: { resource: "space:wg-kalender", permissions: [read, write, delete, delegate] }

2. Alice gibt Bob Schreib-Rechte:
   → grant("space:wg-kalender", bob.did, [read, write])
   → Bob kann lesen und schreiben, aber NICHT delegieren oder löschen

3. Bob versucht Carl einzuladen:
   → delegate(bobsCapability, carl.did, [read])
   → FEHLER: Bob hat kein 'delegate' Permission

4. Alice gibt Bob Delegate-Recht:
   → grant("space:wg-kalender", bob.did, [read, write, delegate])

5. Bob delegiert an Carl (Attenuation!):
   → delegate(bobsCapability, carl.did, [read])
   → Carl kann NUR lesen (Bob kann nicht mehr geben als er hat)

Proof Chain: Alice → Bob → Carl
Jeder Schritt ist signiert und offline-verifizierbar.
```

**POC-Implementierung:** Einfache lokale Prüfung

```
Für den POC reicht:
- Space Creator = Admin (alle Rechte)
- Einladung = implizites read+write
- Keine Delegation

Capabilities werden erst relevant wenn:
- Selektive Sichtbarkeit (Phase 2)
- Gruppen mit unterschiedlichen Rollen (Phase 3)
```

**Langfrist-Implementierung:** UCAN-kompatibel

```
- UCAN Spec folgen für Interoperabilität
- JWT-ähnliches Token-Format
- Capability Storage in IndexedDB
- Revocation via CRL (Certificate Revocation List) oder Bloom Filter
```

---

## Interaktion der Adapter

### Flow: Attestation erstellen und zustellen

```text
Alice will Bob eine Attestation senden: "Bob ist zuverlässig"

1. Alice erstellt Attestation-Payload (JSON)
   → { claim: "Bob ist zuverlässig", fromDid: aliceDid, toDid: bobDid, ... }

2. CryptoAdapter.signString(canonicalPayload, alicePrivateKey)
   → Signatur (Base64)

3. Alice baut MessageEnvelope:
   → { v: 1, id: uuid(), type: 'attestation', fromDid: aliceDid, toDid: bobDid,
       encoding: 'json', payload: canonicalPayload, signature: sig,
       ref: 'wot:attestation:<id>' }

4. MessagingAdapter.send(envelope)
   → DeliveryReceipt { status: 'accepted', messageId: envelope.id }

5. [Bei Bob] MessagingAdapter.onMessage(callback)
   → MessageEnvelope { type: 'attestation', fromDid: aliceDid, ... }

6. [Bei Bob] CryptoAdapter.verifyString(envelope.payload, envelope.signature, alicePublicKey)
   → true (Signatur gültig, fromDid stimmt)

7. [Bei Bob] StorageAdapter.saveAttestation(parsedAttestation)
   → Gespeichert beim Empfänger (Empfänger-Prinzip!)

8. [Bei Bob] Optional: sendet 'ack' Envelope zurück
   → Alice erhält via onReceipt: { status: 'acknowledged' }
```

### Flow: Item selektiv teilen

```text
Alice teilt Kalender-Event mit Bob und Carl, aber NICHT mit Dora.

1. CryptoAdapter.generateSymmetricKey()
   → AES-256-GCM Item-Key (32 bytes)

2. CryptoAdapter.encryptSymmetric(eventData, itemKey)
   → { ciphertext, nonce }

3. StorageAdapter.saveItem(encryptedEvent)
   → Lokal gespeichert

4. Für jeden Empfänger (Bob, Carl):
   a. CryptoAdapter.encrypt(itemKey, recipientPublicKey)
      → EncryptedPayload (asymmetrisch verschlüsselter Item-Key)
   b. MessagingAdapter.send({
        v: 1, id: uuid(), type: 'item-key',
        fromDid: aliceDid, toDid: recipientDid,
        encoding: 'base64', payload: encryptedItemKey,
        signature: sig, ref: 'wot:item:<event-id>'
      })
      → DeliveryReceipt { status: 'accepted' }

5. [Bei Bob] MessagingAdapter.onMessage → empfängt item-key Envelope
6. [Bei Bob] CryptoAdapter.decrypt(encryptedItemKey, bobPrivateKey)
   → Klartext Item-Key (32 bytes)
7. [Bei Bob] CryptoAdapter.decryptSymmetric(ciphertext, nonce, itemKey)
   → Klartext Kalender-Event

Dora hat keinen Item-Key → kann das Event nicht entschlüsseln.
```

### Flow: Gruppe mit gemeinsamen Space

```text
Alice erstellt eine WG-Gruppe mit Bob und Carl.

1. ReplicationAdapter.createSpace('shared')
   → SpaceInfo { id: 'space-abc', type: 'shared', members: [aliceDid] }

2. CryptoAdapter.generateSymmetricKey()
   → AES-256-GCM Group Key (32 bytes)

3. ReplicationAdapter.addMember('space-abc', bobDid)

4. MessagingAdapter.send({
     v: 1, id: uuid(), type: 'space-invite',
     fromDid: aliceDid, toDid: bobDid,
     encoding: 'json', payload: JSON.stringify({ spaceId: 'space-abc', groupKey: encryptedGroupKey }),
     signature: sig, ref: 'wot:space:space-abc'
   })
   → Bob empfängt Einladung + verschlüsselten Group Key

5. [Bei Bob] ReplicationAdapter.joinSpace('space-abc', inviteToken)
   → Bob synct jetzt mit dem Space

6. Bob öffnet Space und erstellt Kanban-Task:
   const handle = await ReplicationAdapter.openSpace('space-abc')
   handle.transact(doc => { doc.tasks.push({ title: 'Einkaufen' }) })
   → CRDT-Operation → synct automatisch zu Alice und Carl
   → Alice/Carl erhalten via handle.onRemoteUpdate() → UI refresht

7. Carl wird entfernt:
   ReplicationAdapter.removeMember('space-abc', carlDid)
   → Group Key Rotation: CryptoAdapter.generateSymmetricKey() → neuer Key
   → MessagingAdapter.send({
       type: 'group-key-rotation', toDid: bobDid,
       ref: 'wot:space:space-abc', ...
     })
   → Nur noch Alice + Bob haben den neuen Key
```

---

## Implementierungs-Phasen

### Phase 1: Fundament (jetzt)

| Adapter | Status | Implementierung |
|---------|--------|----------------|
| StorageAdapter | ✅ Implementiert | EvoluStorageAdapter |
| ReactiveStorageAdapter | ✅ Implementiert | EvoluStorageAdapter |
| CryptoAdapter | ✅ Implementiert | WebCryptoAdapter |
| MessagingAdapter | **Interface definieren** | Custom WebSocket Relay |
| ReplicationAdapter | Interface definieren | NoOp (nur Evolu Personal) |
| AuthorizationAdapter | Interface definieren | NoOp (Creator = Admin) |

**Ziel Phase 1:** Attestations und Verifications zwischen zwei DIDs zustellen.

**Done-Kriterien Phase 1:**

```text
1. Sender erstellt MessageEnvelope (type: 'attestation')
   → CryptoAdapter signiert → Envelope hat gültige Signatur

2. MessagingAdapter.send(envelope) → DeliveryReceipt { status: 'accepted' }
   → Relay hat die Nachricht angenommen und queued

3. Empfänger erhält Envelope via onMessage(callback)
   → Envelope ist vollständig (v, id, type, fromDid, toDid, payload, signature)

4. Empfänger verifiziert Signatur via CryptoAdapter.verifyString()
   → true (Signatur gültig, fromDid stimmt)

5. Empfänger persistiert via StorageAdapter.saveAttestation()
   → Attestation ist lokal gespeichert (Empfänger-Prinzip)

6. Optional: Empfänger sendet 'ack' zurück
   → Sender erhält DeliveryReceipt { status: 'acknowledged' }

Testbar als Integration Test:
  Alice.send(attestation) → Bob.onMessage → Bob.verify → Bob.save → Alice.onReceipt(ack)
```

### Phase 2: Selektives Teilen

| Adapter | Erweiterung |
|---------|-------------|
| CryptoAdapter | Item-Key-Generierung + per-Recipient Encryption |
| MessagingAdapter | Item-Key Delivery |
| AuthorizationAdapter | Basis-Capabilities (read/write pro Item) |

**Ziel Phase 2:** Items mit N ausgewählten Kontakten teilen.

### Phase 3: Gruppen

| Adapter | Erweiterung |
|---------|-------------|
| ReplicationAdapter | Automerge für Shared Spaces |
| AuthorizationAdapter | UCAN Delegation Chains |
| MessagingAdapter | Group Key Rotation |

**Ziel Phase 3:** Gemeinsame Spaces mit Modulen (Kanban, Kalender, Karte).

### Phase 4: Skalierung

| Adapter | Migration |
|---------|-----------|
| MessagingAdapter | Custom WS → Matrix |
| ReplicationAdapter | Evolu → Automerge (Cross-User) |
| AuthorizationAdapter | Volle UCAN-Kompatibilität |

**Ziel Phase 4:** Federation, Bridges, größere Gruppen.

---

## Abgrenzung: Was sich NICHT ändert

| Bereich | Warum unverändert |
|---------|-------------------|
| `wot-core` Types | Identity, Contact, Verification, Attestation bleiben gleich |
| WotIdentity Klasse | BIP39, Ed25519, HKDF, did:key — alles stabil |
| WebCryptoAdapter | Signing, Encryption, DID-Konvertierung — funktioniert |
| EvoluStorageAdapter | Lokale Persistenz + Reactive Queries — funktioniert |
| Empfänger-Prinzip | Fundamentales Design-Prinzip, bestätigt durch Architektur |

---

## Verwandte Dokumente

- [Framework-Evaluation v2](framework-evaluation.md) — Warum kein einzelnes Framework reicht
- [Verschlüsselung](verschluesselung.md) — Item-Key-Modell, E2EE Details
- [Architektur](../datenmodell/architektur.md) — Schichtenmodell (wird aktualisiert)
- [Entitäten](../datenmodell/entitaeten.md) — Datenmodell
- [Social Recovery](../konzepte/social-recovery.md) — Shamir Secret Sharing
