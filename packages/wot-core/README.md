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
import {
  WebCryptoAdapter,
  LocalStorageAdapter,
  createDid
} from '@web-of-trust/core'

// Initialize adapters
const crypto = new WebCryptoAdapter()
const storage = new LocalStorageAdapter()

// Create a new identity
const keyPair = await crypto.generateKeyPair()
const did = createDid(keyPair.publicKey)

console.log(did) // did:key:z6Mk...
```

## Core Concepts

### Decentralized Identifiers (DIDs)

Every identity is a `did:key` - a self-sovereign identifier derived from a cryptographic key pair. No central authority needed.

```typescript
import { createDid, isValidDid } from '@web-of-trust/core'

const did = createDid(publicKeyBytes)
isValidDid(did) // true
```

### Signed Data (JWS)

All trust data is cryptographically signed using JSON Web Signatures:

```typescript
import { signJws, verifyJws } from '@web-of-trust/core'

const jws = await signJws(payload, privateKey)
const verified = await verifyJws(jws, publicKey)
```

### Adapters

The library uses a pluggable adapter pattern:

- **CryptoAdapter** - Key generation, signing, encryption
- **StorageAdapter** - Persist identities, contacts, verifications
- **SyncAdapter** - Synchronize data across devices

```typescript
import type { CryptoAdapter, StorageAdapter } from '@web-of-trust/core'

// Use built-in implementations
import { WebCryptoAdapter, LocalStorageAdapter } from '@web-of-trust/core'

// Or implement your own
class MyStorageAdapter implements StorageAdapter {
  // ...
}
```

## Types

### Identity

```typescript
interface Identity {
  did: string
  publicKey: Uint8Array
  privateKey?: Uint8Array
  profile: Profile
  createdAt: Date
}

interface Profile {
  displayName?: string
  avatar?: string
}
```

### Contact

```typescript
interface Contact {
  did: string
  profile: Profile
  status: ContactStatus
  verifications: Verification[]
  attestations: Attestation[]
}

type ContactStatus = 'pending' | 'verified' | 'blocked'
```

### Verification

```typescript
interface Verification {
  id: string
  fromDid: string
  toDid: string
  location?: GeoLocation
  timestamp: Date
  signature: string
}
```

### Attestation

```typescript
interface Attestation {
  id: string
  fromDid: string
  toDid: string
  type: string
  content: string
  metadata: AttestationMetadata
  signature: string
}
```

## API Reference

### Crypto Utilities

| Function | Description |
|----------|-------------|
| `createDid(publicKey)` | Create a did:key from public key bytes |
| `didToPublicKeyBytes(did)` | Extract public key from a did:key |
| `isValidDid(did)` | Validate a did:key format |
| `signJws(payload, privateKey)` | Sign data as JWS |
| `verifyJws(jws, publicKey)` | Verify a JWS signature |
| `extractJwsPayload(jws)` | Get payload without verification |

### Encoding

| Function | Description |
|----------|-------------|
| `encodeBase58(bytes)` | Encode bytes to Base58 |
| `decodeBase58(string)` | Decode Base58 to bytes |
| `encodeBase64Url(bytes)` | Encode bytes to Base64URL |
| `decodeBase64Url(string)` | Decode Base64URL to bytes |

### Adapters

| Class | Description |
|-------|-------------|
| `WebCryptoAdapter` | Browser-native crypto using Web Crypto API |
| `LocalStorageAdapter` | IndexedDB-based storage for browser |
| `NoOpSyncAdapter` | Placeholder sync adapter (does nothing) |

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

## Part of the Web of Trust Project

This package is the foundation for:
- [Demo App](../apps/demo) - Try the Web of Trust
- [Protocol Docs](../docs) - Full specification

## License

MIT
