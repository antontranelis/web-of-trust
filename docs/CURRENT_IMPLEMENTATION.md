# Current Implementation

> **Hinweis:** Dies ist KEINE Spezifikation, sondern dokumentiert den aktuellen Implementierungsstand.
> Die Spezifikation findest du in [docs/flows/](./flows/) und anderen Spec-Dokumenten.

Dieses Dokument zeigt, was bereits implementiert ist und welche Entscheidungen getroffen wurden.

## Letzte Aktualisierung

**Datum:** 2026-02-08
**Phase:** Week 3+ - Architektur-Revision (Post-Evolu-Analyse)

---

## Week 1: Identity Foundation ✅

### Übersicht

Die Grundlage für das Identitätssystem wurde implementiert und vollständig getestet.

### Implementiert

#### WotIdentity Class (`packages/wot-core/src/identity/WotIdentity.ts`)

Vollständige Identity-Management-Lösung mit:

- ✅ **BIP39 Mnemonic Generation** - 12-Wort Recovery-Phrase (128-bit Entropy)
- ✅ **Deutsche BIP39-Wortliste** - 2048 deutsche Wörter (dys2p/wordlists-de)
- ✅ **Deterministic Key Derivation** - Gleicher Mnemonic → gleiche DID
- ✅ **Ed25519 Key Pairs** - @noble/ed25519 Library
- ✅ **did:key Format** - Standard-konforme Decentralized Identifiers
- ✅ **Encrypted Storage** - Seed verschlüsselt in IndexedDB mit PBKDF2 (600k) + AES-GCM
- ✅ **Runtime-only Keys** - Keys nur während Session im Memory
- ✅ **storeSeed Parameter** - Kontrolle wann Identity in IndexedDB gespeichert wird

**API Methods:**

```typescript
// Identity Creation & Recovery
create(passphrase: string, storeSeed: boolean): Promise<{ mnemonic: string, did: string }>
unlock(mnemonic: string, passphrase: string, storeSeed: boolean): Promise<void>
unlockFromStorage(passphrase: string): Promise<void>

// Cryptographic Operations
sign(data: string): Promise<string>
getDid(): string
getPublicKeyMultibase(): Promise<string>

// Storage Management
hasStoredIdentity(): Promise<boolean>
deleteStoredIdentity(): Promise<void>

// Framework Integration
deriveFrameworkKey(info: string): Promise<Uint8Array>
```

#### Deutsche BIP39-Wortliste (`packages/wot-core/src/wordlists/german-positive.ts`)

- ✅ **2048 deutsche Wörter** - Quelle: [dys2p/wordlists-de](https://github.com/dys2p/wordlists-de)
- ✅ **BIP39-konform** - Erste 4 Zeichen jedes Worts sind einzigartig
- ✅ **Validierung** - Runtime-Check auf exakt 2048 Wörter
- ✅ **User-facing: "Magische Wörter"** - Mnemonic heißt in der UI "Magische Wörter"

#### SeedStorage Class (`packages/wot-core/src/identity/SeedStorage.ts`)

Sichere Seed-Verschlüsselung und -Speicherung:

- ✅ **IndexedDB Storage** - Browser-native persistence
- ✅ **PBKDF2 Key Derivation** - 600,000 iterations
- ✅ **AES-GCM Encryption** - Authenticated encryption
- ✅ **Random Salt & IV** - Pro Storage-Operation
- ✅ **Passphrase Protection** - HMAC validation

#### Demo App Integration

- ✅ **Onboarding Flow** - Neue Identität erstellen
  - Mnemonic anzeigen (einmalig, "Magische Wörter")
  - Mnemonic-Verifikation (3 zufällige Wörter)
  - Passphrase setzen → Encrypted Storage
  - Enter-Navigation in allen Schritten
  - storeSeed=false bei Generierung, storeSeed=true erst nach Passphrase
- ✅ **Recovery Flow** - Identität aus Mnemonic wiederherstellen
  - storeSeed=true beim Import
- ✅ **Unlock Flow** - Identität aus verschlüsseltem Storage entsperren
- ✅ **Identity Management** - DID anzeigen, Identität löschen
- ✅ **Persistenz-Handling** - hasStoredIdentity Check beim App-Start
  - Loading State während Check
  - Unlock Screen wenn Identity gespeichert
  - Onboarding Screen wenn keine Identity

#### Shared UI Components

- ✅ **ProgressIndicator** - Step-Anzeige im Onboarding
- ✅ **SecurityChecklist** - Checkbox-Liste für Sicherheitsbestätigung
- ✅ **InfoTooltip** - Hilfe-Tooltips

### Tests

**29 Tests** mit vollständiger Coverage:

#### WotIdentity Tests (17 Tests)

```typescript
✓ create() - 12-word mnemonic generation
✓ create() - valid did:key format
✓ create() - store encrypted seed (storeSeed=true)
✓ create() - do not store seed (storeSeed=false)

✓ unlock() - from mnemonic and passphrase
✓ unlock() - deterministic (same mnemonic → same DID)
✓ unlock() - throws on invalid mnemonic

✓ unlockFromStorage() - from encrypted seed
✓ unlockFromStorage() - throws with wrong passphrase
✓ unlockFromStorage() - throws when no seed stored

✓ sign() - returns base64url signature

✓ getPublicKeyMultibase() - returns multibase format

✓ hasStoredIdentity() - returns false when empty
✓ hasStoredIdentity() - returns true after storing

✓ deleteStoredIdentity() - deletes seed
✓ deleteStoredIdentity() - locks identity after deletion

✓ Deterministic Key Derivation - same mnemonic across instances
```

#### SeedStorage Tests (12 Tests)

```typescript
✓ storeSeed() and loadSeed() - correct passphrase
✓ storeSeed() - seed is encrypted
✓ loadSeed() - throws with wrong passphrase
✓ loadSeed() - returns null when empty

✓ hasSeed() - returns false when empty
✓ hasSeed() - returns true after storing
✓ hasSeed() - returns false after deletion

✓ deleteSeed() - removes stored seed
✓ deleteSeed() - no error when deleting non-existent

✓ Security: different salt per storage operation
✓ Security: different passphrases for same seed
```

**Test Environment:**

- Vitest with happy-dom
- fake-indexeddb for IndexedDB simulation
- All tests passing ✅

---

## Week 2: In-Person Verification ✅

### Übersicht Week 2

Das bestehende Verification-System wurde auf WotIdentity migriert und vollständig getestet. Challenge-Response-Protokoll mit Ed25519-Signaturen funktioniert end-to-end.

### Implementiert Week 2

#### ContactStorage Class (`packages/wot-core/src/contact/ContactStorage.ts`)

IndexedDB-basierte Contact-Verwaltung:

- ✅ **CRUD Operations** - Add, Get, Update, Remove Contacts
- ✅ **Status Management** - Pending → Active nach Verification
- ✅ **DID-based Lookup** - Contacts via did:key identifiziert
- ✅ **Timestamp Tracking** - createdAt, updatedAt, verifiedAt
- ✅ **Active Contact Filter** - Schneller Zugriff auf verifizierte Contacts

**API Methods:**

```typescript
addContact(contact: Contact): Promise<void>
getContact(did: string): Promise<Contact | null>
getAllContacts(): Promise<Contact[]>
updateContact(did: string, updates: Partial<Contact>): Promise<void>
activateContact(did: string): Promise<void>
removeContact(did: string): Promise<void>
getActiveContacts(): Promise<Contact[]>
```

#### VerificationHelper Class (`packages/wot-core/src/verification/VerificationHelper.ts`)

Challenge-Response-Protokoll mit WotIdentity:

- ✅ **Challenge Creation** - Nonce + Timestamp + DID + Public Key
- ✅ **Challenge Response** - Responder fügt eigene Identity-Info hinzu
- ✅ **Signature Creation** - Ed25519 signature via WotIdentity.sign()
- ✅ **Signature Verification** - Multibase public key conversion + WebCrypto verify
- ✅ **Nonce Validation** - Schutz gegen Replay-Angriffe
- ✅ **Nonce Fallback** - Nonce aus Response wenn Challenge-State verloren
- ✅ **Base64 Encoding** - QR-Code-kompatibel

**API Methods:**

```typescript
createChallenge(identity: WotIdentity, name: string): Promise<string>
respondToChallenge(code: string, identity: WotIdentity, name: string): Promise<string>
completeVerification(code: string, identity: WotIdentity, nonce: string): Promise<Verification>
verifySignature(verification: Verification): Promise<boolean>
publicKeyFromDid(did: string): string
multibaseToBytes(multibase: string): Uint8Array
```

**Verification Flow:**

1. **Anna (Initiator):** `createChallenge()` → Challenge Code (Base64)
2. **Ben (Responder):** `respondToChallenge(code)` → Response Code (Base64)
3. **Anna (Completes):** `completeVerification(responseCode)` → Signed Verification
4. **Storage:** Verification gespeichert bei Anna (Empfänger-Prinzip)
5. **Contacts:** Beide fügen sich gegenseitig als "active" Contact hinzu

#### Demo App Services

**VerificationService** - Vereinfacht zu thin wrapper:
- Core-Logik delegiert an VerificationHelper
- Storage-Persistenz für Verification-Records
- Encoding/Decoding-Helpers für QR-Codes

**ContactService** - Migriert zu ContactStorage:
- Ersetzt StorageAdapter-Calls durch ContactStorage
- Gleiche API-Oberfläche beibehalten
- Nutzt IndexedDB statt localStorage

#### Demo App Hooks

**useVerification** - Migriert zu WotIdentity:
- Ersetzt `useIdentity + KeyPair` durch `useWotIdentity`
- Nutzt VerificationHelper aus wot-core
- Challenge/Response-Flow unverändert
- Automatic contact activation nach Verification

#### QR-Code Support (Week 2 Extension)

**ShowCode Component** - QR-Code Generation:

- ✅ **Automatische QR-Generierung** - 256x256px QR-Code mit `qrcode` package
- ✅ **Visuell prominent** - QR-Code zentral angezeigt
- ✅ **Dev-Mode Fallback** - Text-Code in collapsible `<details>`
- ✅ **Copy & Paste** - Für Development ohne QR-Scanner

**ScanCode Component** - QR-Scanner:

- ✅ **Kamera-Scanner** - `html5-qrcode` mit live preview
- ✅ **"QR-Code scannen" Button** - Startet Kamera mit Permission-Request
- ✅ **Stop-Button** - Rotes X zum Abbrechen des Scans
- ✅ **Auto-Fill** - Gescannter Code wird automatisch eingetragen
- ✅ **Dev-Mode Fallback** - Manuelle Text-Eingabe in collapsible details
- ⚠️ **Kamera-Permission** - Benötigt HTTPS oder localhost für Browser-Kamera-Zugriff

### Tests Week 2

**35 neue Tests** (zusätzlich zu 29 Week 1 Tests):

#### ContactStorage Tests (15 Tests)

```typescript
✓ addContact() - store contact with did:key format
✓ addContact() - default status is pending
✓ addContact() - throws if contact already exists

✓ getContact() - retrieve by DID
✓ getContact() - returns null for non-existent

✓ getAllContacts() - returns all stored contacts
✓ getAllContacts() - returns empty array when empty

✓ updateContact() - update name
✓ updateContact() - update updatedAt timestamp
✓ updateContact() - throws if contact not found

✓ activateContact() - changes status to active
✓ activateContact() - sets verifiedAt timestamp
✓ activateContact() - throws for non-existent contact

✓ removeContact() - deletes contact from storage
✓ removeContact() - no error for non-existent

✓ getActiveContacts() - filters by active status
✓ getActiveContacts() - returns empty array when none active
```

#### VerificationIntegration Tests (20 Tests)

```typescript
✓ Challenge Creation - with WotIdentity DID and public key
✓ Challenge Creation - encodes to base64
✓ Challenge Creation - generates unique nonce
✓ Challenge Creation - includes challenger name

✓ Challenge Response - responder adds own identity
✓ Challenge Response - encodes to base64
✓ Challenge Response - preserves nonce from challenge
✓ Challenge Response - includes challenge initiator info

✓ Signature Verification - signs with WotIdentity
✓ Signature Verification - verifies using public key multibase
✓ Signature Verification - creates Ed25519Signature2020 proof
✓ Signature Verification - fails with wrong public key
✓ Signature Verification - rejects nonce mismatch

✓ Public Key Exchange - extracts key from did:key format
✓ Public Key Exchange - converts multibase to bytes
✓ Public Key Exchange - parses did:key for public key

✓ Complete Verification Flow - full mutual verification
✓ Complete Verification Flow - bidirectional verification
✓ Complete Verification Flow - nonce fallback for lost challenge state
```

### Demo App Integration Week 2

- ✅ **useWotIdentity Hook** - Demo nutzt WotIdentity statt alte Identity
- ✅ **Verification Flow** - Challenge/Response mit VerificationHelper
- ✅ **Contact Management** - ContactStorage in AdapterContext
- ✅ **Status Management** - Pending → Active nach Verification
- ✅ **Build Success** - TypeScript clean, keine Errors

### Verifizierter End-to-End Flow Week 2

User-Bestätigung: "Läuft noch und es funktioniert" ✅

1. Identity Creation in Browser
2. Challenge Generation
3. Challenge Code Copy/Paste (oder QR)
4. Response Generation
5. Response Code Copy/Paste
6. Verification Completion
7. Contact Storage (beide Seiten)

---

## Week 2+: Identity Polish ✅

### Übersicht

Verbesserungen an Identity-Persistenz und UX nach User-Testing.

### Implementiert

#### Deutsche BIP39-Wortliste

- ✅ **2048 deutsche Wörter** aus [dys2p/wordlists-de](https://github.com/dys2p/wordlists-de)
- ✅ Ersetzt englische Wortliste komplett
- ✅ Validierung: exakt 2048 Wörter, einzigartige erste 4 Zeichen
- ✅ Alle bestehenden Tests laufen weiterhin

#### Identity Persistence Bugfixes

Drei kritische Bugs nach User-Testing gefunden und behoben:

**Bug #1: Vorzeitige Speicherung während Onboarding**
- **Problem:** `create()` speicherte Identity sofort in IndexedDB, bevor User Passphrase gesetzt hatte. Reload bei Mnemonic-Anzeige zeigte Unlock-Screen.
- **Fix:** `storeSeed: false` bei `create()` im OnboardingFlow. Speicherung erst nach Passphrase-Schritt.

**Bug #2: Verlust nach Reload in der App**
- **Problem:** Nach vollständigem Onboarding ging Reload zurück zum Start statt zum Unlock-Screen.
- **Fix:** `hasStoredIdentity` State in WotIdentityContext mit `useEffect` Check beim Mount. App.tsx zeigt Loading → Unlock → App basierend auf Storage-Status.

**Bug #3: Import/Recovery speicherte nicht**
- **Problem:** RecoveryFlow rief `unlock()` ohne `storeSeed=true`. Nach Import war Identity nicht persistent.
- **Fix:** `storeSeed: true` im RecoveryFlow `handleProtect()`.

#### UX-Verbesserungen

- ✅ **Enter-Navigation** im gesamten Onboarding:
  - Step 1 (Generate): Enter → Identity generieren
  - Step 2 (Display): Enter → Weiter (wenn alle Checkboxen gesetzt)
  - Step 3 (Verify): Enter → Nächstes Input / Submit wenn letztes
  - Step 4 (Protect): Enter → Abschließen (wenn Passphrase gültig)

### Tests Week 2+

**13 neue Tests** (OnboardingFlow):

#### OnboardingFlow Tests (13 Tests)

```typescript
✓ Step 1 - generate mnemonic and DID without passphrase
✓ Step 1 - generate different mnemonics on each call

✓ Step 2 - split mnemonic into 12 words
✓ Step 2 - valid BIP39 format

✓ Step 3 - validate correct word at correct position
✓ Step 3 - reject incorrect word at position
✓ Step 3 - handle case-insensitive verification

✓ Step 4 - accept passphrase after mnemonic generated
✓ Step 4 - enforce minimum passphrase length
✓ Step 4 - accept passphrase with 8+ characters
✓ Step 4 - store identity with passphrase protection

✓ Full Flow - complete onboarding flow
```

**Gesamt: 77 Tests** (29 Week 1 + 35 Week 2 + 13 Week 2+) - alle passing ✅ (auch nach Week 3 Evolu Integration)

---

## Week 3: Evolu Integration ✅

### Übersicht Week 3

Evolu als Storage- und Sync-Framework integriert. Die Demo App nutzt jetzt Evolu (SQLite WASM + CRDT) statt des direkten IndexedDB-Adapters für Contacts, Verifications und Attestations. Identity-Daten bleiben in verschlüsseltem IndexedDB (SeedStorage).

### Warum Evolu

- **Custom Keys** (seit Nov 2025, Issue #537) - `externalAppOwner` erlaubt eigene Keys
- **BIP39-kompatibel** - `deriveFrameworkKey('evolu-storage-v1')` → 32-byte `OwnerSecret`
- **Local-first** - SQLite WASM mit OPFS, CRDT-basierter Sync
- **TypeScript-native** - Effect Schema für Type Safety
- **React Integration** - Provider, Hooks, Queries

Details: [docs/protokolle/framework-evaluation.md](./protokolle/framework-evaluation.md)

### Implementiert Week 3

#### Evolu Schema & Setup (`apps/demo/src/db.ts`)

Zentrales Schema mit 4 Tabellen und WotIdentity-Key-Integration:

- ✅ **4 Tabellen** - contact, verification, attestation, attestationMetadata
- ✅ **Branded ID Types** - `ContactId`, `VerificationId`, `AttestationId`, `AttestationMetadataId`
- ✅ **Effect Schema Types** - `NonEmptyString1000`, `SqliteBoolean`, `nullOr()`
- ✅ **Custom Key Integration** - `deriveFrameworkKey('evolu-storage-v1')` → `OwnerSecret` → `AppOwner`
- ✅ **Local-only Transports** - `transports: []` (Sync kommt später)
- ✅ **Instance Management** - `createWotEvolu()`, `getEvolu()`, `isEvoluInitialized()`

```typescript
// Key Integration Pattern:
const frameworkKey = await identity.deriveFrameworkKey('evolu-storage-v1')
const ownerSecret = frameworkKey as unknown as OwnerSecret
const appOwner = createAppOwner(ownerSecret)
const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  name: SimpleName.orThrow('wot'),
  externalAppOwner: appOwner,
  transports: [],
})
```

#### EvoluStorageAdapter (`apps/demo/src/adapters/EvoluStorageAdapter.ts`)

Implementiert `StorageAdapter` Interface mit Evolu als Backend:

- ✅ **Identity in localStorage** - Nicht in Evolu (local-only, kein Sync nötig)
- ✅ **Contacts in Evolu** - CRUD mit deterministic IDs via `createIdFromString<'Contact'>(did)`
- ✅ **Verifications in Evolu** - Empfänger-Prinzip beibehalten
- ✅ **Attestations in Evolu** - Inkl. Metadata (accepted/acceptedAt)
- ✅ **JSON Serialization** - Proof, GeoLocation, tags als JSON Strings in `NonEmptyString1000`
- ✅ **Soft Delete** - Evolu nutzt `isDeleted` statt physischem Löschen
- ✅ **Row Mappers** - Konvertierung Evolu Rows ↔ WoT Types

**Key Patterns:**
```typescript
// Deterministic branded IDs
createIdFromString<'Contact'>(contact.did)

// Branded strings
const str = (s: string) => NonEmptyString1000.orThrow(s)

// Boolean conversion
booleanToSqliteBoolean(true)  // → 1
sqliteBooleanToBoolean(row.accepted)  // → true/false
```

#### Provider-Hierarchie (geändert)

WotIdentity muss vor Evolu initialisiert werden (Evolu braucht abgeleitete Keys):

```
// Vorher (Week 2):
BrowserRouter > AdapterProvider > IdentityProvider > WotIdentityProvider > Routes

// Nachher (Week 3):
BrowserRouter > WotIdentityProvider > RequireIdentity > AdapterProvider(identity) > IdentityProvider > Routes
```

- ✅ **AdapterProvider** akzeptiert jetzt `identity: WotIdentity` prop
- ✅ **Async Initialization** - Evolu wird in `useEffect` initialisiert
- ✅ **RequireIdentity** - Rendert AdapterProvider erst nach Identity-Unlock

#### TypeScript Compatibility

`exactOptionalPropertyTypes: true` in tsconfig (Evolu-Requirement) erforderte 4 Fixes:

- ✅ `AttestationCard.tsx` - Optional props `?: string | undefined`
- ✅ `ContactService.ts` - Spread pattern statt `undefined` assignment
- ✅ `AttestationService.ts` - Spread pattern für tags
- ✅ `LocalStorageAdapter.ts` - Spread pattern für acceptedAt

### Packages

```json
{
  "@evolu/common": "^7.4.1",
  "@evolu/react": "^10.4.0",
  "@evolu/react-web": "^2.4.0"
}
```

### Build Output

Evolu bringt SQLite WASM mit (~1MB):
- `Db.worker-*.js` (~497KB) - SQLite Worker
- `sqlite3.wasm` (~1MB) - SQLite WASM Binary
- OPFS (Origin Private File System) für Browser-Storage

### Tests Week 3

- ✅ **77/77 bestehende Tests passing** - Keine Regressionen
- ✅ **TypeScript clean** - 0 Errors mit `exactOptionalPropertyTypes`
- ✅ **Vite Build erfolgreich** - SQLite WASM + Workers korrekt gebundelt

---

## Week 3+: Architektur-Revision (2026-02-08)

### Übersicht

Während der Evolu-Integration wurde eine fundamentale Lücke offensichtlich: **Evolu kann kein Cross-User Messaging.** Evolu synchronisiert nur innerhalb desselben Owners (Single-User, Multi-Device). SharedOwner-API existiert, ist aber nicht funktional (Discussion #558, Feb 2026).

Dies führte zu einer umfassenden Neu-Evaluation des gesamten Technology-Stacks und einer Erweiterung der Adapter-Architektur.

### Zentrale Erkenntnis

> **Ein einzelnes Framework kann unsere Anforderungen nicht erfüllen.**
>
> CRDT/Sync (Zustandskonvergenz) und Messaging (Cross-User Delivery) sind
> zwei orthogonale Probleme, die unterschiedliche Lösungen brauchen.

### Was passiert ist

1. **Evolu-Limitation erkannt** — SharedOwner nicht funktional, kein Cross-User Messaging
2. **8 Frameworks evaluiert** — Nostr, Matrix, DIDComm, ActivityPub, Iroh, Willow/Earthstar + Updates für DXOS, p2panda
3. **6 eliminiert** — ActivityPub (kein E2EE), Nostr (secp256k1 ≠ Ed25519), DXOS (P-256 ≠ Ed25519), DIDComm (stale JS-Libs), Iroh (nur Networking-Layer), p2panda (kein JS SDK)
4. **2-Achsen-Architektur definiert** — CRDT/Sync-Achse + Messaging-Achse
5. **6-Adapter-Architektur v2** — 3 neue Interfaces (MessagingAdapter, ReplicationAdapter, AuthorizationAdapter)
6. **3 Sharing-Patterns identifiziert** — Group Spaces, Selective Sharing, 1:1 Delivery
7. **UCAN-ähnliche Capabilities** als cross-cutting Concern erkannt

### Neue Adapter-Architektur (v2)

| Adapter | Status | Implementierung |
|---------|--------|----------------|
| StorageAdapter | ✅ Implementiert | EvoluStorageAdapter |
| ReactiveStorageAdapter | ✅ Implementiert | EvoluStorageAdapter |
| CryptoAdapter | ✅ Implementiert | WebCryptoAdapter |
| MessagingAdapter | ✅ **Implementiert** | InMemoryMessagingAdapter + WebSocketMessagingAdapter + wot-relay |
| ReplicationAdapter | **Interface definiert** | NoOp (Evolu Personal Space) |
| AuthorizationAdapter | **Interface definiert** | NoOp (Creator = Admin) |

### Empfohlener Stack

| Achse | POC | Produktion |
|-------|-----|------------|
| CRDT/Sync | Evolu (lokale Persistenz + Multi-Device) | Automerge (Cross-User Spaces) |
| Messaging | Custom WebSocket Relay | Matrix (Gruppen-E2EE, Federation) |
| Authorization | NoOp (Creator = Admin) | Custom UCAN-like (Delegation Chains) |

### Was sich NICHT geändert hat

- **wot-core Package** — Alle Types, Interfaces und Implementierungen bleiben stabil
- **77 Tests** — Alle passing, keine Regressionen
- **WotIdentity** — BIP39, Ed25519, HKDF, did:key — alles unverändert
- **Evolu als Storage** — Bleibt für lokale Persistenz + Multi-Device Sync
- **Empfänger-Prinzip** — Bestätigt als fundamentales Designprinzip

### Neue Dokumentation

- [Framework-Evaluation v2](./protokolle/framework-evaluation.md) — 16 Frameworks evaluiert, Anforderungs-Matrix
- [Adapter-Architektur v2](./protokolle/adapter-architektur-v2.md) — 6-Adapter-Spezifikation, Interaction-Flows
- [Architektur](./datenmodell/architektur.md) — Schichtenmodell aktualisiert

---

## Week 3++: MessagingAdapter + WebSocket Relay (2026-02-08) ✅

### Übersicht

MessagingAdapter-Interface implementiert, WebSocket Relay Server gebaut, Demo App mit Relay verbunden. **Attestation-Delivery funktioniert end-to-end über den Relay.**

### Implementiert

#### MessagingAdapter Interface + Types (`packages/wot-core`)

Neue Types für Cross-User-Messaging:

- ✅ **MessageEnvelope** — Standardisiertes Envelope-Format (v, id, type, fromDid, toDid, encoding, payload, signature, ref)
- ✅ **DeliveryReceipt** — Multi-Stage (accepted → delivered → acknowledged → failed)
- ✅ **MessagingState** — disconnected | connecting | connected | error
- ✅ **ResourceRef** — Branded string `wot:<type>:<id>` für Ressourcen-Adressierung (5 Typen)
- ✅ **8 MessageTypes** — verification, attestation, contact-request, item-key, space-invite, group-key-rotation, ack, content
- ✅ **MessagingAdapter Interface** — connect, disconnect, getState, send, onMessage, onReceipt, registerTransport, resolveTransport

#### InMemoryMessagingAdapter (`packages/wot-core`)

Test-Adapter mit shared-bus Pattern:

- ✅ **Shared static registry** — Map<did, adapter> für In-Memory Message Routing
- ✅ **Offline Queue** — Nachrichten an nicht-verbundene DIDs werden gepuffert
- ✅ **resetAll()** — Test-Isolation

#### WebSocket Relay Server (`packages/wot-relay`)

Minimaler Node.js WebSocket Relay (blind, self-hostable):

- ✅ **DID → WebSocket Mapping** — In-Memory, ephemeral
- ✅ **SQLite Offline Queue** — `better-sqlite3` mit WAL Mode, überlebt Restarts
- ✅ **Relay-Protokoll** — JSON über WebSocket: register/send → registered/message/receipt/error
- ✅ **Blind Relay** — Payload ist `Record<string, unknown>`, Relay sieht keinen Inhalt
- ✅ **CLI Entry Point** — `src/start.ts` mit PORT + DB_PATH Env-Variablen
- ✅ **Delivery Receipts** — accepted (offline) / delivered (online)

#### WebSocketMessagingAdapter (`packages/wot-core`)

Browser-nativer WebSocket Client:

- ✅ **Browser WebSocket API** — Keine `ws` Dependency in wot-core
- ✅ **Implements MessagingAdapter** — connect, disconnect, send, onMessage, onReceipt
- ✅ **Pending Receipts** — Korreliert send() → receipt via Message-ID

#### Demo App Integration

- ✅ **AdapterContext** — WebSocketMessagingAdapter initialisiert, connect(did) nach Evolu-Init
- ✅ **useMessaging Hook** — send, onMessage, state, isConnected
- ✅ **Home Page** — Relay-Status-Anzeige (Wifi/WifiOff Icons, grün/amber/grau)
- ✅ **AttestationService** — Sendet Attestation nach lokaler Speicherung als MessageEnvelope via Relay
- ✅ **useAttestations** — onMessage-Listener empfängt, verifiziert und speichert eingehende Attestationen automatisch
- ✅ **Profil-Verwaltung** — Name editierbar auf Identity-Page, Profil wird bei Init automatisch in localStorage angelegt
- ✅ **RecoveryFlow** — Enter-Navigation in allen Schritten (analog OnboardingFlow)

#### Attestation-Delivery E2E Flow

1. Alice erstellt Attestation → lokal gespeichert + MessageEnvelope an Bobs DID via Relay
2. Bob empfängt Envelope via onMessage → verifiziert Signatur → speichert lokal
3. Attestation erscheint automatisch in Bobs UI (via ReactiveStorage/Subscribable)
4. Funktioniert auch offline: Relay queued in SQLite, liefert bei Reconnect nach

### Tests

**15 neue Tests** (wot-relay, 2 Dateien):

#### Relay Tests (9 Tests)
```
✓ Register DID
✓ Send to online recipient + delivered receipt
✓ Send to offline + accepted receipt
✓ Deliver queued messages on connect
✓ Error without register
✓ Error on invalid JSON
✓ Disconnect cleanup
✓ Multiple clients
✓ Large envelope
```

#### Integration Tests (6 Tests)
```
✓ Send attestation Alice → Bob over real relay
✓ All message types
✓ ResourceRef in envelope
✓ Offline queuing + delivery
✓ Receipt callbacks
✓ Bidirectional messaging
```

**28 neue Tests** (wot-core, MessagingAdapter + ResourceRef):

#### ResourceRef Tests (14 Tests)
```
✓ Create all 5 resource types (attestation, verification, contact, space, item)
✓ Parse round-trip
✓ Sub-paths
✓ DID with colons in ID
✓ Error cases (unknown type, invalid format)
```

#### MessagingAdapter Tests (14 Tests)
```
✓ Lifecycle (connect, disconnect, getState)
✓ Send/receive between two adapters
✓ All 8 message types
✓ Offline queuing + delivery on connect
✓ Receipts
✓ Transport resolution
✓ resetAll for test isolation
```

**Gesamt: 102 Tests** (87 wot-core + 15 wot-relay) — alle passing ✅

### Packages (neu)

```json
// packages/wot-relay/package.json
{
  "name": "@real-life/wot-relay",
  "dependencies": {
    "ws": "^8.18",
    "better-sqlite3": "^11.9"
  }
}
```

### Commits

16. **feat: Add MessagingAdapter interface with InMemory implementation** — Types, Interface, InMemory, 28 Tests
17. **feat: Add WebSocket relay server and WebSocketMessagingAdapter** — wot-relay Package, Integration Tests
18. **feat: Connect demo app to WebSocket relay for live attestation delivery** — Demo Integration, Profil-Verwaltung, RecoveryFlow Enter-Nav

---

## Unterschiede zur Spezifikation

### DID Format

**Spezifikation:** `did:wot:7Hy3kPqR9mNx2Wb5vLz8`
**Implementiert:** `did:key:z6MkpTHz...` (Standard did:key mit multibase)

**Grund:** `did:key` ist ein etablierter W3C-Standard mit breiter Tool-Unterstützung. Eine custom `did:wot` Methode würde eigenen DID Resolver erfordern.

**Konsequenz:** Interoperabilität mit bestehenden DID-Tools und Verifiers.

### Master Key Derivation

**Spezifikation:** BIP39 → PBKDF2 → Ed25519
**Implementiert:** BIP39 → HKDF Master Key (non-extractable) → Ed25519 Identity Key

**Grund:**
- Master Key als HKDF-Quelle ermöglicht sichere Framework-Key-Derivation
- Non-extractable CryptoKey nutzt Hardware-Isolation
- Ermöglicht Ableitung von Evolu-Keys ohne Identity-Key-Exposition

**Vorteil:**
```typescript
// Framework-spezifische Keys ableiten ohne Private Key zu exportieren
const evolKey = await identity.deriveFrameworkKey('evolu-storage-v1')
```

### Wortliste

**Spezifikation / poc-plan:** Englische BIP39-Wortliste
**Implementiert:** Deutsche BIP39-Wortliste (dys2p/wordlists-de)

**Grund:** Deutschsprachige Zielgruppe, bessere Merkbarkeit. User-facing Begriff: "Magische Wörter".

### Storage Passphrase

**Neu implementiert:** Passphrase-Schutz für verschlüsselten Seed

**Grund:** Browser haben keine sichere OS-Keychain. Passphrase bietet zusätzlichen Schutz.

**Workflow:**
1. Identity erstellen (storeSeed=false, kein Passphrase nötig)
2. Passphrase setzen und Seed verschlüsselt speichern (storeSeed=true)
3. Unlock mit gleicher Passphrase

### Mnemonic Länge

**poc-plan:** Teils 24 Wörter (256 bit) erwähnt
**Implementiert:** 12 Wörter (128 bit)

**Grund:** 128 bit bietet ausreichende Security bei besserer UX. BIP39-Standard unterstützt beides.

---

## Nächste Schritte

### Priorität 1: Profil-Sync + Messaging Polish ⬅️ NÄCHSTER SCHRITT

- **Profil-Name im Verification-Handshake** — `useVerification` sendet echten Namen statt hardcoded `'User'`
- **`profile-update` MessageType** — Namensänderungen an alle Kontakte broadcasten via Relay
- **Eingehende Profile-Updates** — Listener in useContacts verarbeitet Updates und ruft `contactService.updateContactName()` auf
- **Cross-Device Profil-Sync** — Profil aus localStorage in Evolu verschieben (Schema-Erweiterung)

### Priorität 2: Selektives Teilen

- **Item-Key-Modell** in CryptoAdapter (AES-256-GCM pro Item, encrypted per Recipient)
- **Item-Key Delivery** über MessagingAdapter
- **AuthorizationAdapter** Basis-Capabilities (read/write)

### Priorität 3: Gruppen & Module

- **ReplicationAdapter** mit Automerge für Shared Spaces
- **RLS Module Integration** — Kanban, Kalender, Karte
- **Group Key Management** — Rotation bei Member-Änderung

### Erledigt (ehemals Priorität 1)

- ~~MessagingAdapter Interface in wot-core definieren~~ ✅
- ~~Custom WebSocket Relay implementieren~~ ✅
- ~~Attestation Delivery E2E~~ ✅
- **Identity-System konsolidieren** — altes IdentityService/useIdentity entfernen (Plan existiert, niedrige Priorität)

### Zurückgestellt

- **DID Server** (poc-plan Week 2) — did:key reicht für POC, kein Server nötig
- **Evolu Sync Transports** — Kommt wenn Multi-Device relevant wird
- **Matrix Integration** — Erst nach POC-Phase wenn Federation nötig

---

## Technische Entscheidungen

### WebCrypto API vs. Externe Libraries

**Entscheidung:** Native WebCrypto API + @noble/ed25519
**Grund:**
- WebCrypto für HKDF, PBKDF2, AES-GCM (zero dependencies)
- @noble/ed25519 für Ed25519 Signing (WebCrypto Ed25519 hat Browser-Kompatibilitätsprobleme)
- Hardware-backed wenn verfügbar
- Browser-Security-Updates automatisch

### IndexedDB vs. LocalStorage

**Entscheidung:** IndexedDB
**Grund:**
- Kann CryptoKey-Objekte direkt speichern
- Größere Storage-Limits
- Async API (non-blocking)

### Fake-IndexedDB für Tests

**Entscheidung:** fake-indexeddb npm package
**Grund:**
- Node.js hat kein natives IndexedDB
- happy-dom alleine reicht nicht
- Ermöglicht echte Storage-Tests ohne Browser

### Evolu als Storage/Sync Framework

**Entscheidung:** Evolu (SQLite WASM + CRDT)
**Grund:**
- Custom Keys seit Nov 2025 (`externalAppOwner` in `DbConfig`)
- `deriveFrameworkKey('evolu-storage-v1')` → 32-byte `OwnerSecret` passt perfekt
- Local-first mit CRDT-basiertem Sync (Relay kommt später)
- Effect Schema für Type Safety (branded types)
- OPFS-basiertes Storage im Browser (kein IndexedDB-Limit)
- React Provider + Hooks Integration

**Trade-off:** Identity-Daten bleiben in eigenem IndexedDB (SeedStorage), nicht in Evolu. Grund: Verschlüsselter Seed darf nicht gesynct werden.

### Deutsche Wortliste

**Entscheidung:** dys2p/wordlists-de (2048 Wörter)
**Grund:**
- Etablierte, BIP39-konforme deutsche Wortliste
- Breite Community-Nutzung
- Keine Umlaute-Verwirrung (ae/ue/oe statt ä/ü/ö)

---

## Commits & Git History

### Week 1 Commits

1. **Initial WotIdentity implementation** - BIP39 + Ed25519 + did:key
2. **Add SeedStorage with PBKDF2+AES-GCM**
3. **Refactor: SecureWotIdentity → WotIdentity** - Cleaner naming
4. **Add comprehensive tests (29 tests)** - WotIdentity + SeedStorage
5. **Update wot-core README** - API documentation
6. **Add Implementation Status** - This document

### Week 2 Commits

7. **Week 2 Core Complete: Verification with WotIdentity** - ContactStorage + VerificationHelper
8. **feat: Add QR code support for in-person verification**
9. **fix: QR scanner DOM timing and update docs**
10. **fix: Handle lost challenge state in completeVerification**
11. **feat: Add delete identity button to /identity page**
12. **fix: Delete all data when navigate to root**
13. **Add nonce fallback test for lost challenge state**

### Week 2+ Commits

14. **feat: Add German BIP39 wordlist and fix identity persistence** - Deutsche Wortliste, 3 Persistence-Bugs, Enter-Navigation

### Week 3 Commits

15. **feat: Integrate Evolu as storage backend** - Schema, EvoluStorageAdapter, Provider-Hierarchie, Custom Keys

---

## File Structure (aktuell)

### wot-core Package

```
packages/wot-core/src/
├── identity/
│   ├── WotIdentity.ts              # Haupt-Identity-Klasse
│   ├── SeedStorage.ts              # Encrypted seed storage
│   └── index.ts
├── contact/
│   ├── ContactStorage.ts           # Contact CRUD in IndexedDB
│   └── index.ts
├── verification/
│   ├── VerificationHelper.ts       # Challenge-Response-Protokoll
│   └── index.ts
├── wordlists/
│   ├── german-positive.ts          # 2048 deutsche BIP39-Wörter
│   └── index.ts
├── crypto/
│   ├── did.ts                      # DID utilities
│   ├── encoding.ts                 # Base64/multibase
│   ├── jws.ts                      # JWS signing
│   └── index.ts
├── adapters/
│   ├── interfaces/
│   │   ├── StorageAdapter.ts
│   │   ├── CryptoAdapter.ts
│   │   ├── SyncAdapter.ts
│   │   ├── MessagingAdapter.ts       # NEU: Cross-User Messaging
│   │   └── index.ts
│   ├── crypto/
│   │   ├── WebCryptoAdapter.ts
│   │   └── index.ts
│   ├── messaging/
│   │   ├── InMemoryMessagingAdapter.ts  # NEU: Shared-Bus für Tests
│   │   ├── WebSocketMessagingAdapter.ts # NEU: Browser WebSocket Client
│   │   └── index.ts
│   ├── storage/
│   │   ├── LocalStorageAdapter.ts
│   │   └── index.ts
│   └── index.ts
├── types/
│   ├── identity.ts
│   ├── contact.ts
│   ├── verification.ts
│   ├── attestation.ts
│   ├── proof.ts
│   ├── messaging.ts                   # NEU: MessageEnvelope, DeliveryReceipt
│   ├── resource-ref.ts               # NEU: ResourceRef branded type
│   └── index.ts
└── index.ts
```

### Demo App

```
apps/demo/src/
├── components/
│   ├── identity/
│   │   ├── OnboardingFlow.tsx       # Neuer Identity-Flow (4 Steps)
│   │   ├── RecoveryFlow.tsx         # Mnemonic-Import
│   │   ├── UnlockFlow.tsx           # Passphrase-Unlock
│   │   ├── IdentityManagement.tsx   # Routing: Onboarding/Unlock/Recovery
│   │   ├── CreateIdentity.tsx
│   │   ├── IdentityCard.tsx
│   │   └── index.ts
│   ├── verification/
│   │   ├── VerificationFlow.tsx
│   │   ├── ShowCode.tsx             # QR-Code Generation
│   │   ├── ScanCode.tsx             # QR-Code Scanner
│   │   └── index.ts
│   ├── contacts/
│   │   ├── ContactCard.tsx
│   │   ├── ContactList.tsx
│   │   └── index.ts
│   ├── shared/
│   │   ├── ProgressIndicator.tsx
│   │   ├── SecurityChecklist.tsx
│   │   ├── InfoTooltip.tsx
│   │   └── index.ts
│   └── layout/
│       ├── AppShell.tsx
│       ├── Navigation.tsx
│       └── index.ts
├── adapters/
│   └── EvoluStorageAdapter.ts       # StorageAdapter via Evolu
├── context/
│   ├── WotIdentityContext.tsx       # Identity State + hasStoredIdentity
│   ├── AdapterContext.tsx           # Evolu init + EvoluStorageAdapter
│   ├── IdentityContext.tsx
│   └── index.ts
├── hooks/
│   ├── useVerification.ts
│   ├── useContacts.ts
│   ├── useIdentity.ts
│   ├── useAttestations.ts
│   ├── useMessaging.ts                # NEU: Relay send/onMessage/state
│   └── index.ts
├── services/
│   ├── VerificationService.ts
│   ├── ContactService.ts
│   ├── IdentityService.ts
│   ├── AttestationService.ts
│   └── index.ts
├── pages/
│   ├── Home.tsx
│   ├── Identity.tsx
│   ├── Verify.tsx
│   ├── Contacts.tsx
│   ├── Attestations.tsx
│   └── index.ts
├── db.ts                            # Evolu Schema + createWotEvolu()
├── App.tsx                          # RequireIdentity + Loading/Unlock
└── main.tsx
```

### Tests

```
packages/wot-core/tests/
├── WotIdentity.test.ts              # 17 Tests
├── SeedStorage.test.ts              # 12 Tests
├── ContactStorage.test.ts           # 15 Tests
├── VerificationIntegration.test.ts  # 20 Tests  (Anm: 18 nach Dedup)
├── OnboardingFlow.test.ts           # 13 Tests  (Anm: 12 nach Dedup)
├── ResourceRef.test.ts              # 14 Tests  NEU
├── MessagingAdapter.test.ts         # 14 Tests  NEU
└── setup.ts                         # fake-indexeddb setup

packages/wot-relay/tests/
├── relay.test.ts                    # 9 Tests   NEU
└── integration.test.ts              # 6 Tests   NEU
```

---

## Lessons Learned

### Was gut funktioniert hat

- **BIP39 für Recovery** - Standard-Wortliste, breite Tool-Unterstützung
- **Deutsche Wortliste** - Bessere Merkbarkeit für Zielgruppe
- **did:key Format** - Keine eigene Infrastruktur nötig
- **Deterministic Keys** - Gleicher Mnemonic → gleiche DID
- **Test-First Approach** - Tests helfen Bugs früh zu finden
- **User-Testing** - 3 kritische Persistence-Bugs durch reales Testen gefunden
- **storeSeed Parameter** - Feine Kontrolle über Speicherzeitpunkt

### Herausforderungen

- **WebCrypto Complexity** - Viele subtile Details (extractable, usages, etc.)
- **Test Environment** - IndexedDB Mocking erforderte fake-indexeddb
- **Passphrase Storage** - Browser haben keine sichere OS-Keychain
- **Identity Persistence** - Timing wann Identity gespeichert wird ist kritisch
- **React State vs. Storage** - hasStoredIdentity muss beim Mount geprüft werden

### Für nächste Weeks

- ~~MessagingAdapter implementieren~~ ✅ (Week 3++)
- ~~Attestation Delivery E2E~~ ✅ (Week 3++)
- **Profil-Sync** — Name bei Verification mitschicken + profile-update Broadcast
- **Relay Deployment** — Docker + öffentliche URL für Remote-Testing
- **Evolu Sync** - Transports konfigurieren für Multi-Tab/Device Sync
- **Social Recovery (Shamir)** - Seed-Backup über verifizierte Kontakte

---

## Architektur-Entscheidungen (Forschung)

### DID-Methode: did:key (bestätigt)

Nach umfassender Evaluation von 6 DID-Methoden (did:key, did:peer, did:web, did:webvh, did:dht, did:plc) bleibt **did:key** unsere Wahl für den POC.

**Gründe:**
- Keine Infrastruktur nötig (kein Server, kein DHT)
- Offline-fähig und self-certifying
- BIP39 Seed → deterministische DID → Multi-Device gelöst (gleicher Seed = gleiche DID)
- Bestätigt durch Murmurations Network (nutzt ebenfalls did:key + Ed25519)

**Mittelfristig:** did:key + did:peer Hybrid (did:peer für 1:1-Kanäle mit Key Rotation)

**Langfristig:** WoT-Layer methoden-agnostisch (verschiedene Nutzer können verschiedene DID-Methoden nutzen)

Details: [docs/konzepte/did-methoden-vergleich.md](./konzepte/did-methoden-vergleich.md)

### Multi-Device: Seed-basiert

Multi-Device ist durch BIP39 bereits gelöst: Gleicher Seed auf allen Geräten eingeben → gleiche DID, gleicher Key.

Kein Login-Token-System, kein Server, keine Email nötig. Murmurations braucht dafür Login Tokens und Email-Recovery, weil ihre Keys non-exportable sind.

### Recovery: Social Recovery (geplant)

Drei Schutzschichten geplant:

1. **BIP39 Mnemonic** (✅ implementiert) - Seed aufschreiben
2. **Shamir Secret Sharing** (nächster Schritt) - Seed in Shards aufteilen, an verifizierte Kontakte verteilen
3. **Guardian Recovery** (später) - Verifizierte Kontakte autorisieren neuen Key (braucht Key Rotation)

Unser WoT ist gleichzeitig das Guardian-Netzwerk: Verifizierte Kontakte = natürliche Recovery-Partner.

Details: [docs/konzepte/social-recovery.md](./konzepte/social-recovery.md)

### UCAN → AuthorizationAdapter (aktiv geplant)

Murmurations nutzt UCAN (User Controlled Authorization Networks) für capability-basierte Delegation. In der Architektur-Revision v2 ist dies zum **AuthorizationAdapter** geworden — inspiriert von UCAN und Willow/Meadowcap:

- Signierte, delegierbare Capabilities
- Attenuation (jede Delegation kann nur einschränken)
- Offline-verifizierbare Proof Chains
- Phasen: NoOp (POC) → Basis-Capabilities (Phase 2) → Volle UCAN-Kompatibilität (Phase 4)

Details: [Adapter-Architektur v2](./protokolle/adapter-architektur-v2.md#authorizationadapter)

---

*Dieses Dokument wird nach jeder Week aktualisiert.*