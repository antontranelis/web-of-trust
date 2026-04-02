# WoT Core: TypeScript to Rust Migration Assessment

**Status:** Not planned — preparing portability only
**Date:** 2026-03-30
**Context:** The WoT Core is written in TypeScript. Human Money Core is written in Rust. This document evaluates whether migrating the WoT Core to Rust would be beneficial and tracks portability preparations.

---

## What Rust Would Bring

- **Cryptographic correctness via type system** — A private key is its own type that cannot be accidentally logged or serialized. In TS, a key is a `Uint8Array` — nothing prevents passing it to `console.log()`. Rust's compiler enforces these invariants.
- **Guaranteed key zeroizing** — The `zeroize` crate guarantees keys are wiped from memory. In JS/TS, the garbage collector decides when — and "when" can be "never".
- **No runtime surprises** — No `undefined is not a function`, no implicit type coercion, no `NaN` poisoning. Exhaustive pattern matching forces handling every case.
- **Auditability** — A Rust core is easier for security auditors to review: less hidden runtime magic, explicit control flow. No `node_modules` jungle with thousands of transitive dependencies.
- **Performance at scale** — Trust graph computation (decay, multipath) over many hops, batch verification of hundreds of signatures: 10-100x speed difference matters here.

## What Rust Does NOT Bring

- **Memory safety is not an argument against TS** — TypeScript/JavaScript is already memory-safe through the runtime (garbage collector, no manual memory management). Buffer overflows and use-after-free are not a concern in TS.
- **For individual crypto operations**, Web Crypto API is already natively fast — sign/verify barely benefit from Rust.
- **UI, CRDT sync (Yjs), networking** — stay in JS/TS regardless. Rust adds no value here.

## Additional Benefits Through HMC Integration

If HMC and WoT share a Rust core:

- **Unified core** — WoT + HMC share crypto primitives, identity, and data structures directly. No mapping between two worlds. Sebastian can develop directly against the WoT Core without a bridge.
- **Single source of truth** — No risk of TS core and Rust core diverging. Security audits only need to review one crypto stack.

## Arguments Against Migration

- **Web version becomes WASM-dependent** — WoT Core in the browser = WASM. Automerge (also Rust/WASM) had massive performance problems on mobile browsers (Vanadium) — the main reason for migrating to Yjs. WoT operations (sign, verify, graph query) are discrete calls, not continuous CRDT sync, so the risk is lower but not zero.
- **Massive migration effort** — 7 adapters, identity, attestations, crypto: all need rewriting. Yjs binding stays in JS; the bridge between Rust core and Yjs needs careful design. During migration, two systems must be maintained simultaneously.
- **Team bottleneck** — Rust expertise currently: Anton, Sebastian Galek. TypeScript ecosystem is much larger (NPM, community, contributor pool). New contributors need to know or learn Rust.
- **Slowed feature development** — During migration, new features stall. Rust has a steeper learning curve and slower iteration (compile times, borrow checker).

## Decision Framework

| Question | Answer -> Tendency |
| --- | --- |
| Will the trust graph exceed 10,000 nodes in 12 months? | Yes -> Rust. No -> TS is sufficient. |
| How tightly will HMC integrate with the WoT Core? | Deep (library) -> Rust. Loosely coupled (API) -> TS is sufficient. |
| How many devs can/want to write Rust? | Many -> Rust. Few -> TS is safer. |
| How critical is time-to-market? | Very -> TS. Less -> Rust pays off long-term. |

The key question: **How tightly will WoT and HMC be intertwined?** If HMC consumes the WoT Core as a library (as Sebastian's Concept Canvas describes), a unified Rust core is a significant advantage. If HMC remains a loosely coupled module, the bridge is sufficient.

## Current Assessment

For the current state — small network, few hundred users, foundational work — Rust brings no immediate advantage. The TS core works, Web Crypto API is fast enough, and the team is more productive in TS. The pragmatic path: design the WoT Core to be portable (clean interfaces, clear separation of crypto/graph/adapter) without migrating now.

---

## Portability Preparations (completed 2026-03-30)

The following changes have been made to ensure the WoT Core *could* be ported later:

**Done:**

- **Encoding utils deduplicated** — `encodeBase58`, `encodeBase64Url`, `decodeBase64Url` now live centrally in `crypto/encoding.ts`. Duplicate private methods in `WotIdentity` and `SeedStorage` removed.
- **SeedStorageAdapter interface extracted** — New interface in `adapters/interfaces/`. The existing IndexedDB implementation (`SeedStorage`) implements it. On native, a Keychain/Keystore implementation can be swapped in.
- **WotIdentity: constructor injection** — Accepts optional `SeedStorageAdapter` and `CryptoAdapter` (defaults: IndexedDB + WebCryptoAdapter). All existing callers (`new WotIdentity()`) work unchanged.
- **verifyEnvelope: portable verify function** — Accepts optional `EnvelopeVerifyFn` (default: Web Crypto API). Can be implemented with any crypto backend.
- **CryptoAdapter extended** — New methods: `importMasterKey`, `deriveBits` (HKDF), `deriveKeyPairFromSeed` (deterministic Ed25519), `deriveEncryptionKeyPair` (X25519), `encryptAsymmetric`/`decryptAsymmetric` (ECIES), `randomBytes`. Opaque types `MasterKeyHandle` and `EncryptionKeyPair` for platform-independent handles.
- **WotIdentity fully migrated to CryptoAdapter** — Zero direct `crypto.subtle` calls. All crypto operations go through the injectable adapter. `@noble/ed25519` import removed from WotIdentity (lives in adapter only). Shared `initFromSeed()` method eliminates duplication.
- 17 new tests for extended CryptoAdapter methods, 308 tests total — all green.

**Still open:**

- **CryptoKey as platform-specific type** — The CryptoAdapter interface uses `CryptoKey` (Web Crypto API) in the public API (e.g., `getPublicKey()`, `sign()`). For a Rust port, this type would need to be replaced with an opaque handle or byte arrays. Effort: medium, affects all callers.
- **exportPublicKeyJwk()** — Only remaining direct `crypto.subtle` call in WotIdentity. JWK export is Web Crypto specific.
- **signJws()** — Delegates to `jws.ts`, which also uses `crypto.subtle` directly. Can be ported analogously to `verifyEnvelope`.
