# WoT Spec Core

This directory is the protocol-level TypeScript implementation of the WoT specification. It is intentionally separate from the legacy application/core services.

## Boundary

`src/spec` contains deterministic protocol rules and small ports only:

- canonical JSON and JWS encoding
- DID/key encoding helpers
- identity and derived-key material
- trust artifacts such as attestations and SD-JWT vectors
- sync artifacts such as ECIES, encrypted log payloads, log-entry JWS, and capabilities

`src/spec` must not import from:

- `src/identity/WotIdentity`
- app services
- storage adapters
- messaging adapters
- CRDT adapters
- UI code

Concrete platform integrations live outside the core boundary:

- `src/spec-adapters/web-crypto.ts` implements the crypto port with Web Crypto.

The dependency direction is:

```txt
spec-adapters -> spec
spec -/-> spec-adapters
spec -/-> legacy app/core services
```

## Layout

```txt
src/spec/
  crypto/
    encoding.ts       Base58/Base64URL helpers
    hex.ts            Hex helpers
    jcs.ts            JSON Canonicalization Scheme
    jws.ts            JCS-based Ed25519 JWS create/verify composition
    ports.ts          Crypto port used by protocol code

  identity/
    did-document.ts   DID document types
    did-key.ts        did:key and multibase helpers
    key-derivation.ts Phase-1 identity key derivation
    device-key-binding.ts

  trust/
    attestation-vc-jws.ts
    delegated-attestation-bundle.ts
    sd-jwt-vc.ts

  sync/
    admin-key.ts
    encryption.ts     ECIES and encrypted log payload composition
    log-entry.ts
    personal-doc.ts
    space-capability.ts
```

## Public Import

From package consumers, use the namespace exports:

```ts
import { spec, specAdapters } from '@web_of_trust/core'

const crypto = new specAdapters.WebCryptoSpecCryptoAdapter()
const identity = await spec.deriveSpecIdentityFromSeedHex(seedHex, crypto)
```

Within package tests, imports use `../src/spec` and `../src/spec-adapters`.

## Test Vectors

The interop tests use vendored copies of `wot-spec` vectors:

```txt
packages/wot-core/tests/fixtures/wot-spec/phase-1-interop.json
packages/wot-core/tests/fixtures/wot-spec/device-delegation.json
```

Keep these byte-identical to:

```txt
wot-spec/test-vectors/phase-1-interop.json
wot-spec/test-vectors/device-delegation.json
```

The main TypeScript interop test is:

```txt
packages/wot-core/tests/SpecInterop.test.ts
```

## Validation

Run the spec repository validation:

```bash
npm run validate
```

Run the TypeScript implementation validation from `web-of-trust`:

```bash
pnpm --filter @web_of_trust/core test
pnpm --filter @web_of_trust/core typecheck
pnpm --filter @web_of_trust/core build
```

Compare vendored fixtures before relying on interop results:

```bash
cmp -s ../wot-spec/test-vectors/phase-1-interop.json packages/wot-core/tests/fixtures/wot-spec/phase-1-interop.json
cmp -s ../wot-spec/test-vectors/device-delegation.json packages/wot-core/tests/fixtures/wot-spec/device-delegation.json
```

## Coverage

See `COVERAGE.md` for the current vector-to-implementation matrix.
