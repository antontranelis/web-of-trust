# Current Implementation

> **Hinweis:** Dies ist KEINE Spezifikation, sondern dokumentiert den aktuellen Implementierungsstand.
> Die Spezifikation findest du in [docs/flows/](./flows/) und anderen Spec-Dokumenten.

Dieses Dokument zeigt, was bereits implementiert ist und welche Entscheidungen getroffen wurden.

## Letzte Aktualisierung

**Datum:** 2026-02-06
**Phase:** Week 2 - In-Person Verification Complete

---

## Week 1: Identity Foundation ✅

### Übersicht

Die Grundlage für das Identitätssystem wurde implementiert und vollständig getestet.

### Implementiert

#### WotIdentity Class (`packages/wot-core/src/identity/WotIdentity.ts`)

Vollständige Identity-Management-Lösung mit:

- ✅ **BIP39 Mnemonic Generation** - 12-Wort Recovery-Phrase (128-bit Entropy)
- ✅ **Deterministic Key Derivation** - Gleicher Mnemonic → gleiche DID
- ✅ **Ed25519 Key Pairs** - Native WebCrypto API
- ✅ **did:key Format** - Standard-konforme Decentralized Identifiers
- ✅ **Encrypted Storage** - Seed verschlüsselt in IndexedDB mit PBKDF2 (600k) + AES-GCM
- ✅ **Runtime-only Keys** - Keys als non-extractable CryptoKey, nur während Session im Memory

**API Methods:**

```typescript
// Identity Creation & Recovery
create(passphrase: string, storeSeed: boolean): Promise<{ mnemonic: string, did: string }>
unlock(mnemonic: string, passphrase: string): Promise<void>
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

#### SeedStorage Class (`packages/wot-core/src/identity/SeedStorage.ts`)

Sichere Seed-Verschlüsselung und -Speicherung:

- ✅ **IndexedDB Storage** - Browser-native persistence
- ✅ **PBKDF2 Key Derivation** - 600,000 iterations
- ✅ **AES-GCM Encryption** - Authenticated encryption
- ✅ **Random Salt & IV** - Pro Storage-Operation
- ✅ **Passphrase Protection** - HMAC validation

#### Demo App Integration

- ✅ **Onboarding Flow** - Neue Identität erstellen
  - Mnemonic anzeigen (einmalig)
  - Mnemonic-Verifikation (3 zufällige Wörter)
  - Encrypted Storage
- ✅ **Recovery Flow** - Identität aus Mnemonic wiederherstellen
- ✅ **Unlock Flow** - Identität aus verschlüsseltem Storage entsperren
- ✅ **Identity Management** - DID anzeigen, Identität löschen

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

### Dokumentation

- ✅ **wot-core README** - Vollständige API-Dokumentation mit Beispielen
- ✅ **Test Coverage** - 29 Tests dokumentiert
- ✅ **Implementation Status** - Dieses Dokument

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

### Tests Week 2

**35 neue Tests** (zusätzlich zu 29 Week 1 Tests):

#### ContactStorage Tests (18 Tests)

```typescript
✓ addContact() - store contact with did:key format
✓ addContact() - store multibase public key
✓ addContact() - default status is pending
✓ addContact() - throws if contact already exists

✓ getContact() - retrieve by DID
✓ getContact() - returns null for non-existent

✓ getAllContacts() - returns all stored contacts
✓ getAllContacts() - returns empty array when empty

✓ updateContact() - update name
✓ updateContact() - update status
✓ updateContact() - update multiple fields
✓ updateContact() - throws if contact not found

✓ activateContact() - changes status to active
✓ activateContact() - sets verifiedAt timestamp

✓ removeContact() - deletes contact from storage
✓ removeContact() - no error for non-existent

✓ getActiveContacts() - filters by active status
✓ getActiveContacts() - returns empty array when none active
```

#### VerificationIntegration Tests (17 Tests)

```typescript
✓ Challenge Creation - with WotIdentity DID and public key
✓ Challenge Creation - encodes to base64
✓ Challenge Creation - includes timestamp and nonce
✓ Challenge Creation - includes challenger name

✓ Challenge Response - responder adds own identity
✓ Challenge Response - preserves original nonce
✓ Challenge Response - encodes to base64
✓ Challenge Response - includes responder name

✓ Complete Verification - validates nonce match
✓ Complete Verification - throws on nonce mismatch
✓ Complete Verification - creates Ed25519Signature2020 proof
✓ Complete Verification - signs with initiator identity

✓ Signature Verification - verifies valid signature
✓ Signature Verification - rejects invalid signature

✓ Public Key Exchange - extracts key from did:key format
✓ Public Key Exchange - converts multibase to bytes
✓ Public Key Exchange - handles Ed25519 0xed01 prefix correctly
```

**Gesamt:** 64 Tests (29 Week 1 + 35 Week 2) - alle passing ✅

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
3. Challenge Code Copy/Paste (oder QR in Zukunft)
4. Response Generation
5. Response Code Copy/Paste
6. Verification Completion
7. Contact Storage (beide Seiten)

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

### Storage Passphrase

**Neu implementiert:** Passphrase-Schutz für verschlüsselten Seed

**Grund:** Browser haben keine sichere OS-Keychain. Passphrase bietet zusätzlichen Schutz.

**Workflow:**
1. Identity erstellen mit Passphrase
2. Seed verschlüsselt in IndexedDB speichern
3. Unlock mit gleicher Passphrase

---

## Nächste Schritte (Week 3+)

### QR-Code Enhancement (Optional Week 2 Extension)

**Geplant:**

- ❌ QR-Code Generation in ShowCode.tsx (mit `qrcode` npm package)
- ❌ QR-Code Scanner in ScanCode.tsx (mit `html5-qrcode`)
- ❌ URL Format: `wot://verify?did=<did>&name=<name>&pk=<publicKey>`

### Contact List UI (Week 3)

**Geplant:**

- Contact List View auf `/contacts`
- Filter: Alle / Active / Pending
- Contact Details mit Verification-Info

### Sync Protocol (Week 3+)

**Geplant:**
- CRDTs für offline-first
- Sync Server API
- Conflict Resolution

### Content Sharing (Week 4+)

**Geplant:**
- Item Encryption (per-item keys)
- Group Key Management
- Shared Content UI

---

## Technische Entscheidungen

### WebCrypto API vs. Externe Libraries

**Entscheidung:** Native WebCrypto API
**Grund:**
- Zero dependencies für Crypto-Operationen
- Hardware-backed wenn verfügbar
- Browser-Security-Updates automatisch
- Non-extractable Keys möglich

**Trade-off:** Komplexere Implementierung vs. externe Lib

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

---

## Commits & Git History

### Week 1 Commits

1. **Initial WotIdentity implementation** - BIP39 + Ed25519 + did:key
2. **Add SeedStorage with PBKDF2+AES-GCM**
3. **Refactor: SecureWotIdentity → WotIdentity** - Cleaner naming
4. **Add comprehensive tests (29 tests)** - WotIdentity + SeedStorage
5. **Update wot-core README** - API documentation
6. **Add Implementation Status** - This document

---

## Lessons Learned

### Was gut funktioniert hat

- **BIP39 für Recovery** - Standard-Wortliste, breite Tool-Unterstützung
- **did:key Format** - Keine eigene Infrastruktur nötig
- **Deterministic Keys** - Gleicher Mnemonic → gleiche DID
- **Test-First Approach** - Tests helfen Bugs früh zu finden
- **IndexedDB für CryptoKeys** - Native Browser-Integration

### Herausforderungen

- **WebCrypto Complexity** - Viele Subtile Details (extractable, usages, etc.)
- **Test Environment** - IndexedDB Mocking erforderte fake-indexeddb
- **Passphrase Storage** - Browser haben keine sichere OS-Keychain

### Für nächste Weeks

- **Specifications updaten** - did:wot → did:key durchgehend
- **Verification Flow testen** - End-to-End mit zwei Geräten
- **Error Messages verbessern** - Nutzerfreundlicher

---

*Dieses Dokument wird nach jeder Week aktualisiert.*
