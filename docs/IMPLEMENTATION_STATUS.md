# Implementation Status

Dieses Dokument dokumentiert den aktuellen Implementierungsstand des Web of Trust Projekts.

## Letzte Aktualisierung

**Datum:** 2026-02-06
**Phase:** Week 1 - Identity Foundation Complete

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
- ✅ **Encrypted Storage** - PBKDF2 (600k iterations) + AES-GCM
- ✅ **Non-extractable Master Key** - Hardware-backed wenn verfügbar

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

## Nächste Schritte (Week 2+)

### In-Person Verification (Week 2)

Die Verify-Seite (`/verify`) existiert bereits, nutzt aber noch das alte Identity-System:

**Zu migrieren:**
- ❌ `useIdentity` → `useWotIdentity`
- ❌ `VerificationFlow` aktualisieren
- ❌ QR-Code Format anpassen an `did:key`
- ❌ Challenge-Response mit WotIdentity.sign()

### Contact Management (Week 2)

**Geplant:**
- ContactStorage mit IndexedDB
- Verification Record Speicherung
- Contact List UI

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
