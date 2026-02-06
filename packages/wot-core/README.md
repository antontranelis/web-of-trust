# @web-of-trust/core

Core library for building decentralized Web of Trust applications.

## What is Web of Trust?

A system where trust grows through real-world encounters. People meet, verify each other's identity, and build reputation through genuine actions - not followers or likes.

Three pillars:
- **Verification** - Confirm identity through meeting in person
- **Cooperation** - Share encrypted content (calendars, maps, projects)
- **Attestation** - Build reputation through real deeds

## Installation

```bash
npm install @web-of-trust/core
# or
pnpm add @web-of-trust/core
```

## Quick Start

```typescript
import { WotIdentity } from '@web-of-trust/core'

// Create a new identity
const identity = new WotIdentity()
const result = await identity.create('your-secure-passphrase', true)

console.log(result.mnemonic) // 12-word BIP39 mnemonic
console.log(result.did)      // did:key:z6Mk...

// Later: Unlock from storage
const identity2 = new WotIdentity()
await identity2.unlockFromStorage('your-secure-passphrase')
console.log(identity2.getDid()) // Same DID
```

## Core Concepts

### Identity Management with WotIdentity

`WotIdentity` provides a secure, deterministic identity system based on BIP39 mnemonics:

**Key Features:**

- **BIP39 Mnemonic**: 12-word recovery phrase (128-bit entropy)
- **Deterministic**: Same mnemonic always produces same DID
- **Encrypted Storage**: Seed encrypted with PBKDF2 + AES-GCM
- **Native WebCrypto**: Pure browser crypto, no external dependencies
- **Non-extractable Keys**: Master key never leaves crypto hardware

```typescript
import { WotIdentity } from '@web-of-trust/core'

const identity = new WotIdentity()

// Create new identity
const { mnemonic, did } = await identity.create('passphrase', true)
// Save the mnemonic securely! It's the only way to recover your identity

// Recover from mnemonic
await identity.unlock(mnemonic, 'passphrase')

// Sign data
const signature = await identity.sign('Hello, World!')

// Get public key
const pubKey = await identity.getPublicKeyMultibase()
```

### Decentralized Identifiers (DIDs)

Every identity is a `did:key` - a self-sovereign identifier derived from an Ed25519 public key. No central authority needed.

```typescript
const did = identity.getDid()
console.log(did) // did:key:z6MkpTHz...
```

### Encrypted Storage

Identity seeds are stored encrypted in IndexedDB:

- Passphrase → PBKDF2 (600k iterations) → AES-GCM encryption
- Random salt and IV per storage operation
- Master key is non-extractable (stays in crypto hardware)

```typescript
// Check if identity exists
const hasIdentity = await identity.hasStoredIdentity()

// Delete stored identity
await identity.deleteStoredIdentity()
```

## API Reference

### WotIdentity

Core identity management class.

#### Constructor

```typescript
const identity = new WotIdentity()
```

#### Methods

**`create(passphrase: string, storeSeed: boolean): Promise<{ mnemonic: string, did: string }>`**

Create a new identity with a BIP39 mnemonic.

```typescript
const { mnemonic, did } = await identity.create('secure-passphrase', true)
// Save mnemonic securely! It's your only recovery method
```

**`unlock(mnemonic: string, passphrase: string): Promise<void>`**

Restore identity from BIP39 mnemonic.

```typescript
await identity.unlock(mnemonic, 'secure-passphrase')
```

**`unlockFromStorage(passphrase: string): Promise<void>`**

Unlock identity from encrypted storage.

```typescript
await identity.unlockFromStorage('secure-passphrase')
```

**`sign(data: string): Promise<string>`**

Sign data with Ed25519, returns base64url signature.

```typescript
const signature = await identity.sign('Hello, World!')
```

**`getDid(): string`**

Get the current DID (throws if locked).

```typescript
const did = identity.getDid() // did:key:z6Mk...
```

**`getPublicKeyMultibase(): Promise<string>`**

Get public key in multibase format (z-prefixed base58btc).

```typescript
const pubKey = await identity.getPublicKeyMultibase()
```

**`hasStoredIdentity(): Promise<boolean>`**

Check if encrypted seed exists in storage.

```typescript
const exists = await identity.hasStoredIdentity()
```

**`deleteStoredIdentity(): Promise<void>`**

Delete encrypted seed from storage and lock identity.

```typescript
await identity.deleteStoredIdentity()
```

**`deriveFrameworkKey(info: string): Promise<Uint8Array>`**

Derive framework-specific keys using HKDF.

```typescript
const evolKey = await identity.deriveFrameworkKey('evolu-storage-v1')
```

### SeedStorage

Low-level encrypted storage for identity seeds.

```typescript
import { SeedStorage } from '@web-of-trust/core'

const storage = new SeedStorage()

// Store encrypted
await storage.storeSeed(seedBytes, 'passphrase')

// Load and decrypt
const seed = await storage.loadSeed('passphrase')

// Check existence
const exists = await storage.hasSeed()

// Delete
await storage.deleteSeed()
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

### Testing

The package includes comprehensive test coverage:

- **29 tests** covering identity creation, encryption, deterministic key derivation
- Uses Vitest with happy-dom and fake-indexeddb for browser environment simulation
- Tests validate BIP39 mnemonic generation, PBKDF2+AES-GCM encryption, and Ed25519 signing

Run tests with:

```bash
pnpm test
```

## Part of the Web of Trust Project

This package is the foundation for:
- [Demo App](../apps/demo) - Try the Web of Trust
- [Protocol Docs](../docs) - Full specification

## License

MIT
