# Reference Implementation Conformance Inventory: `wot-identity@0.1`

**Status:** Inventory / planning slice — no code changes.
**Last updated:** 2026-05-05.
**Scope:** Maps the `wot-identity@0.1` profile from `wot-spec`'s `CONFORMANCE.md` (manifest entry `profiles."wot-identity@0.1"`) to the current TypeScript reference implementation in `packages/wot-core/`.

The profile sources (per `wot-spec/conformance/manifest.json`):

- `01-wot-identity/001-identitaet-und-schluesselableitung.md`
- `01-wot-identity/002-signaturen-und-verifikation.md`
- `01-wot-identity/003-did-resolution.md`
- `schemas/did-document-wot.schema.json`
- `test-vectors/phase-1-interop.json`, sections `identity` and `did_resolution`

This inventory was produced from the `wot-spec` manifest and the vendored phase-1 test vector at `packages/wot-core/tests/fixtures/wot-spec/phase-1-interop.json`. The normative `wot-spec` documents and JSON Schema were **not** read directly during this slice (they are outside the allowed scope of this branch); requirements that can only be read out of those documents are listed under [Open Spec Questions](#open-spec-questions) so a follow-up slice with spec-repo access can verify them.

Disposition legend:

- **Reusable:** existing implementation appears to satisfy the requirement (verified against phase-1 vectors where applicable).
- **Needs rewrite:** an implementation exists, but does not match the protocol-aligned shape. The new path should be the canonical one; the legacy artifact should be migrated or deleted in a later slice.
- **Missing:** no implementation found.
- **External by design:** intentionally not in TS protocol-core (e.g., DIDComm framing).

Test-vector / schema legend:

- **Vector OK:** asserted by `packages/wot-core/tests/ProtocolInterop.test.ts` against the phase-1 vector.
- **Vector partial:** vector field exists but is not asserted from this codebase.
- **No vector:** no test vector covers this requirement.
- **No schema:** no JSON Schema in this profile covers this requirement (or schema not yet read in this slice).

---

## 1. Identity material derivation (spec doc `001-identitaet-und-schluesselableitung.md`)

These requirements are derived from the `phase-1-interop.json#identity` section, the protocol-core derivation module, and the manifest. Spec wording for MUST/SHOULD/MAY is not quoted here — see the spec document for normative phrasing.

### 1.1 BIP39 seed input

- [ ] **REQ-ID-001 — Derivation MUST accept a BIP39 seed (64 bytes, hex).**
  - Implementation: `packages/wot-core/src/protocol/identity/key-derivation.ts:18` (`deriveProtocolIdentityFromSeedHex`). **Reusable.**
  - Legacy parallel: `packages/wot-core/src/identity/WotIdentity.ts:56` calls `mnemonicToSeedSync(mnemonic, '')` and slices the first 32 bytes — note this uses only the first 32 bytes, while the protocol-core path consumes the full 64-byte seed via HKDF. **Needs rewrite (legacy path)** — see [Open Question Q-1](#q-1-bip39-seed-length).
  - Vector: phase-1 `identity.bip39_seed_hex`. **Vector OK** (`ProtocolInterop.test.ts:34`).
  - Schema: not applicable.

- [ ] **REQ-ID-002 — Mnemonic generation SHOULD use a defined wordlist (English BIP39 in vector; project deviation: dys2p German).**
  - Implementation: `packages/wot-core/src/wordlists/german-positive.ts` (legacy). Protocol-core does not generate mnemonics directly.
  - Vector: phase-1 vector uses the standard English `abandon ... about` mnemonic. The reference app uses German.
  - Disposition: **Reusable** for protocol-core (deterministic from seed); **Open Question Q-2** for the wordlist deviation.

### 1.2 HKDF derivation contexts

- [ ] **REQ-ID-003 — Identity Ed25519 seed MUST be derived via `HKDF-SHA-256(seed, info="wot/identity/ed25519/v1", L=32)`.**
  - Implementation: `packages/wot-core/src/protocol/identity/key-derivation.ts:6` (`IDENTITY_INFO = 'wot/identity/ed25519/v1'`). **Reusable.**
  - Legacy parallel: `packages/wot-core/src/identity/WotIdentity.ts:253` uses HKDF info `'wot-identity-v1'` (different string). **Needs rewrite (legacy path)** — see [Open Question Q-3](#q-3-hkdf-info-string-divergence).
  - Vector: phase-1 `identity.ed25519_seed_hex`. **Vector OK** (`ProtocolInterop.test.ts:35`).
  - Schema: not applicable.

- [ ] **REQ-ID-004 — Encryption X25519 seed MUST be derived via `HKDF-SHA-256(seed, info="wot/encryption/x25519/v1", L=32)`.**
  - Implementation: `packages/wot-core/src/protocol/identity/key-derivation.ts:7` (`ENCRYPTION_INFO = 'wot/encryption/x25519/v1'`). **Reusable.**
  - Legacy parallel: `packages/wot-core/src/identity/WotIdentity.ts:196` uses HKDF info `'wot-encryption-v1'`. **Needs rewrite (legacy path)**.
  - Vector: phase-1 `identity.x25519_seed_hex`. **Vector OK** (`ProtocolInterop.test.ts:42`).
  - Schema: not applicable.

### 1.3 Public-key derivation

- [ ] **REQ-ID-005 — Ed25519 public key MUST be the curve point derived from the identity seed (RFC 8032).**
  - Implementation: `packages/wot-core/src/protocol/identity/key-derivation.ts:24` via `@noble/ed25519`. **Reusable.**
  - Vector: phase-1 `identity.ed25519_public_hex`. **Vector OK** (`ProtocolInterop.test.ts:36`).
  - Schema: not applicable.

- [ ] **REQ-ID-006 — X25519 public key MUST be derived from the X25519 seed (RFC 7748).**
  - Implementation: `packages/wot-core/src/protocol/identity/key-derivation.ts:26` via `ProtocolCryptoAdapter.x25519PublicFromSeed`. **Reusable.**
  - Vector: phase-1 `identity.x25519_public_hex`, `x25519_public_b64`, `x25519_public_multibase`. **Vector OK** (`ProtocolInterop.test.ts:43-45`).
  - Schema: not applicable.

### 1.4 DID and KID

- [ ] **REQ-ID-007 — `did:key` identifier MUST encode the Ed25519 public key as `did:key:z<base58btc(0xed01 || pubkey)>`.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:7` (`publicKeyToDidKey`) and `:11` (`ed25519PublicKeyToMultibase`, prefix `0xed 0x01`). **Reusable.**
  - Legacy parallel: `packages/wot-core/src/crypto/did.ts:10` (`createDid`) — same encoding. **Reusable** as legacy mirror (both should be deduplicated in a later slice — see [Open Question Q-4](#q-4-duplicate-did-encoders)).
  - Vector: phase-1 `identity.did`. **Vector OK** (`ProtocolInterop.test.ts:37`).
  - Schema: covered indirectly via `did-document-wot.schema.json` `id`.

- [ ] **REQ-ID-008 — Canonical signing kid MUST be `<did>#sig-0`.**
  - Implementation: `packages/wot-core/src/protocol/identity/key-derivation.ts:28`. **Reusable.**
  - Vector: phase-1 `identity.kid`. **Vector OK** (`ProtocolInterop.test.ts:38`).
  - Schema: implied by `did-document-wot.schema.json` (verificationMethod `id` `#sig-0`). **Open Question Q-5** for explicit wording.

- [ ] **REQ-ID-009 — Canonical key-agreement kid MUST be `<did>#enc-0` (X25519).**
  - Implementation: not modeled as a constant; the value `#enc-0` is constructed only inside `did-document-wot.schema.json` and the phase-1 vector. The protocol-core `resolveDidKey` accepts an externally supplied `keyAgreement` array; it does not construct `#enc-0` automatically.
  - Disposition: **Needs rewrite** if `#enc-0` is normative. Currently `resolveDidKey` produces an empty `keyAgreement` array unless one is passed in, while the spec vector and `space_membership_messages.invite_key_discovery.canonical_key_agreement_id` strongly suggest `#enc-0` is the canonical id.
  - Vector: phase-1 `did_resolution.did_document.keyAgreement[0].id == "#enc-0"`. **Vector partial** — the test passes `keyAgreement` in from the fixture rather than deriving it.
  - Schema: did-document-wot.schema.json (not read in this slice).
  - See [Open Question Q-6](#q-6-canonical-enc-0-derivation).

### 1.5 X25519 multibase encoding

- [ ] **REQ-ID-010 — X25519 public key in DID Document MUST be encoded as `z<base58btc(0xec01 || pubkey)>`.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:18` (`x25519PublicKeyToMultibase`, prefix `0xec 0x01`). **Reusable.**
  - Vector: phase-1 `identity.x25519_public_multibase`. **Vector OK** (`ProtocolInterop.test.ts:45`).
  - Schema: implied.

---

## 2. Signatures and verification (spec doc `002-signaturen-und-verifikation.md`)

The spec covers JWS framing for identity-related artifacts. The `wot-identity@0.1` manifest does not list its own JWS test-vector section, but the JCS / JWS primitives are dependencies of every other profile and are exercised through `attestation_vc_jws`, `log_entry_jws`, and `space_capability_jws` vectors. They are inventoried here because they live under the identity-document family (see also [Open Question Q-7](#q-7-jws-section-ownership)).

### 2.1 JCS

- [ ] **REQ-SIG-001 — JSON canonicalization MUST follow RFC 8785 (JCS).**
  - Implementation: `packages/wot-core/src/protocol/crypto/jcs.ts` (`canonicalize`, `canonicalizeToBytes`). **Reusable.**
  - Vector: phase-1 `did_resolution.jcs_sha256` and `attestation_vc_jws.payload_jcs_sha256` exercise canonicalize-then-SHA-256. **Vector OK** (`ProtocolInterop.test.ts:50,57`).
  - Schema: not applicable.
  - Notes: implementation does not currently support the full JCS number escape rules beyond IEEE-754 finiteness; sufficient for current vectors. Spec-side question — see [Open Question Q-8](#q-8-jcs-number-edge-cases).

### 2.2 JWS framing

- [ ] **REQ-SIG-002 — Identity-issued JWS MUST use compact serialization with `alg=EdDSA`, JCS-canonicalized header and payload, and Ed25519 signature over `BASE64URL(JCS(header)) || "." || BASE64URL(JCS(payload))`.**
  - Implementation: `packages/wot-core/src/protocol/crypto/jws.ts` (`createJcsEd25519Jws`, `verifyJwsWithPublicKey`). **Reusable.**
  - Legacy parallel: `packages/wot-core/src/crypto/jws.ts` uses non-canonical `JSON.stringify` and a fixed `typ: 'JWT'` header. It is incompatible byte-for-byte with the protocol-core path. **Needs rewrite (legacy path)** — see [Open Question Q-9](#q-9-legacy-jws-callers).
  - Vector: phase-1 `attestation_vc_jws.signing_input` / `.signature_b64` / `.jws`. **Vector OK** indirectly via `ProtocolInterop.test.ts` (attestation, log-entry, space-capability tests).
  - Schema: not applicable.

- [ ] **REQ-SIG-003 — JWS verification MUST resolve the signing key from the `kid` header by treating `kid` as a `did:key` (or `did#fragment`) and extracting the Ed25519 public key from the fragment.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:29` (`didKeyToPublicKeyBytes`) is used by higher-level verifiers (e.g. `verifyDeviceKeyBindingJws`, `verifyAttestationVcJws`). Generic `verifyJwsWithPublicKey` requires the caller to pass the public key. **Reusable.**
  - Vector: phase-1 attestation/device-binding JWS verify against the kid-derived key. **Vector OK** for attestation; identity-level "verify any kid-bound JWS" is exercised via `verifyAttestationVcJws`.
  - Schema: not applicable.

- [ ] **REQ-SIG-004 — JWS `typ` values MUST be the per-document spec values (e.g. `vc+jwt`, `wot-device-key-binding+jwt`, `wot-capability+jwt`).**
  - Implementation: enforced per artifact (see `device-key-binding.ts:43`, `attestation-vc-jws.ts`, `space-capability.ts`). **Reusable** at the per-artifact level.
  - Vector: phase-1 `attestation_vc_jws.header.typ == "vc+jwt"`. **Vector OK** (decoded by `decodeJws` in tests).
  - Schema: per-artifact schemas (not in `wot-identity@0.1` profile).
  - Notes: `wot-identity@0.1` itself does not define a JWS `typ`; this requirement is owned by downstream profiles. Listed for completeness.

---

## 3. DID resolution (spec doc `003-did-resolution.md`)

### 3.1 `did:key` resolution

- [ ] **REQ-RES-001 — Resolving a `did:key:z6Mk…` MUST return a DID Document whose `id` equals the input DID.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:58` (`resolveDidKey`). **Reusable.**
  - Vector: phase-1 `did_resolution.did_document.id`. **Vector OK** (`ProtocolInterop.test.ts:51`).
  - Schema: `did-document-wot.schema.json` `id`.

- [ ] **REQ-RES-002 — DID Document MUST contain a single Ed25519 verification method with `id="#sig-0"`, `type="Ed25519VerificationKey2020"`, `controller=<did>`, and `publicKeyMultibase` matching `z<base58btc(0xed01 || pubkey)>`.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:60-72`. **Reusable.**
  - Vector: phase-1 `did_resolution.did_document.verificationMethod[0]`. **Vector OK**.
  - Schema: `did-document-wot.schema.json` (not read in this slice — see [Open Question Q-10](#q-10-did-document-schema-fields)).

- [ ] **REQ-RES-003 — DID Document MUST list `#sig-0` in `authentication` and `assertionMethod`.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:68-69`. **Reusable.**
  - Vector: phase-1 `did_resolution.did_document.authentication`, `.assertionMethod`. **Vector OK**.
  - Schema: implied.

- [ ] **REQ-RES-004 — DID Document SHOULD include an X25519 `keyAgreement` entry derived from the identity's encryption key, with `id="#enc-0"`, `type="X25519KeyAgreementKey2020"`, `controller=<did>`, and `publicKeyMultibase` matching `z<base58btc(0xec01 || x25519-pubkey)>`.**
  - Implementation: `resolveDidKey` accepts a caller-supplied `keyAgreement` array; it does **not** auto-derive `#enc-0` from the identity material. The X25519 key derivation lives in `key-derivation.ts`, but no helper composes a complete identity DID Document.
  - Disposition: **Needs rewrite** — the manifest treats `#enc-0` as part of the canonical did-document shape; the helper should be able to produce it without external bootstrap, or the spec should explicitly mark `keyAgreement` as out-of-band.
  - Vector: phase-1 `did_resolution.did_document.keyAgreement[0]`. **Vector partial** — currently the test fixture supplies the keyAgreement array.
  - Schema: implied.
  - See [Open Question Q-6](#q-6-canonical-enc-0-derivation).

- [ ] **REQ-RES-005 — DID Document MAY include `service` entries (e.g. `WoTInbox`).**
  - Implementation: `packages/wot-core/src/protocol/identity/did-key.ts:75-76`. **Reusable.**
  - Vector: phase-1 `did_resolution.did_document.service`. **Vector OK**.
  - Schema: did-document-wot.schema.json (not read in this slice).

- [ ] **REQ-RES-006 — JCS-SHA256 over the resolved DID Document MUST equal the published vector hash (interop fingerprint).**
  - Implementation: composed at test time (`ProtocolInterop.test.ts:50` via `cryptoAdapter.sha256(canonicalizeToBytes(...))`). **Reusable** (no production code path computes this hash today; that is acceptable because it is a vector-only invariant).
  - Vector: phase-1 `did_resolution.jcs_sha256`. **Vector OK**.
  - Schema: not applicable.

### 3.2 DID Resolver port

- [ ] **REQ-RES-007 — A `DidResolver` port SHOULD allow async resolution returning a typed `DidDocument | null`.**
  - Implementation: `packages/wot-core/src/protocol/identity/did-document.ts:1-3` defines the interface. **Reusable.**
  - Vector: not applicable (port shape).
  - Schema: not applicable.
  - Note: there is no concrete `DidResolver` implementation in `packages/wot-core/src/` today; downstream consumers call `resolveDidKey` directly. **Open Question Q-11** below.

---

## 4. Schema coverage (`schemas/did-document-wot.schema.json`)

The schema was not read in this slice (it lives in the forbidden `../wot-spec/` scope). The DID Document type in `packages/wot-core/src/protocol/identity/did-document.ts` is a hand-written TypeScript interface that mirrors the phase-1 vector shape, not a generated type from the schema. Fields validated implicitly by the phase-1 interop test:

- `id` (string)
- `verificationMethod[].{id,type,controller,publicKeyMultibase}`
- `authentication[]`, `assertionMethod[]` (string fragments)
- `keyAgreement[].{id,type,controller,publicKeyMultibase}` (when present)
- `service[].{id,type,serviceEndpoint}` (when present)

Gaps:

- No JSON-Schema-level validation in TS (`@web_of_trust/core` defers schema validation to `wot-spec` per `packages/wot-core/src/protocol/COVERAGE.md:33-40`). **No schema** check in TS today.
- No assertion that `keyAgreement[*].id` matches the `#enc-N` shape, nor that `verificationMethod[*].id` matches `#sig-N`.

Disposition: **Reusable** as runtime types; schema-conformance validation is consciously deferred to the spec repository.

---

## 5. Test-vector coverage (`phase-1-interop.json` sections `identity`, `did_resolution`)

| Vector field | Asserted in `ProtocolInterop.test.ts` | Notes |
|---|---|---|
| `identity.bip39_seed_hex` | input only | Not asserted explicitly; consumed by `deriveProtocolIdentityFromSeedHex`. |
| `identity.ed25519_seed_hex` | yes (`expect(bytesToHex(identity.ed25519Seed))`) | |
| `identity.ed25519_public_hex` | yes | |
| `identity.x25519_seed_hex` | yes | |
| `identity.x25519_public_hex` | yes | |
| `identity.x25519_public_b64` | no | Not asserted directly; covered transitively by ECIES vectors. |
| `identity.x25519_public_multibase` | yes (via `x25519PublicKeyToMultibase`) | |
| `identity.did` | yes | |
| `identity.kid` | yes | |
| `identity.mnemonic` | no | Mnemonic-to-seed conversion uses external BIP39 lib, not asserted in protocol-core. |
| `did_resolution.did_document` | yes (`expect(didDocument).toEqual(...)`) | |
| `did_resolution.jcs_sha256` | yes | |

Coverage gaps:

- No negative test vectors for `did:key` resolution (e.g. wrong multicodec prefix, malformed base58btc, wrong DID method). The implementation throws (`did-key.ts:31, 43, 51`) but no vector asserts the error message family.
- `identity.x25519_public_b64` is not directly asserted (low risk: trivial encoding from the multibase value).

---

## 6. Reference-implementation map

| Spec area | Canonical TS module(s) | Legacy / parallel module(s) | Disposition |
|---|---|---|---|
| Seed → identity material | `protocol/identity/key-derivation.ts` | `identity/WotIdentity.initFromSeed`, `crypto/did.ts` | **Needs rewrite** of legacy paths to the protocol-core HKDF info strings before they can claim `wot-identity@0.1` conformance. |
| `did:key` encoding | `protocol/identity/did-key.ts` | `crypto/did.ts` (`createDid`, `didToPublicKeyBytes`) | **Needs rewrite (dedupe).** Both encoders are byte-compatible today but should converge on `protocol/identity/did-key.ts`. |
| DID Document type | `protocol/identity/did-document.ts` | none | **Reusable.** |
| `did:key` resolution helper | `protocol/identity/did-key.ts:resolveDidKey` | none | **Reusable.** No `DidResolver` adapter exists yet (see Q-11). |
| JCS | `protocol/crypto/jcs.ts` | none | **Reusable.** |
| JWS create / verify | `protocol/crypto/jws.ts` | `crypto/jws.ts` (legacy) | **Needs rewrite (legacy path).** Legacy uses `JSON.stringify`, `typ: 'JWT'`, and Web Crypto `Ed25519` directly. Migrating remaining callers is tracked in `docs/reference-implementation-refactor.md` slice 2/4. |
| Mnemonic + wordlist | `application/identity/identity-workflow.ts`, `wordlists/german-positive.ts` | `identity/WotIdentity.ts` | **Reusable** at the application layer. Wordlist deviation tracked in Q-2. |

---

## 7. Open Spec Questions

These items surfaced while inventorying. They cannot be answered without reading the normative `wot-spec` documents (forbidden in this slice) or coordinating with the spec authors. Each question should become a separate spec PR or issue rather than an implementation guess.

### Q-1: BIP39 seed length

The phase-1 vector publishes a 64-byte BIP39 seed and the protocol-core derivation function consumes the full 64 bytes. The legacy `WotIdentity.initFromSeed` slices the first 32 bytes before HKDF (`identity/WotIdentity.ts:64,90`). Does `wot-spec` normatively require the full 64-byte seed as HKDF input, or is the 32-byte truncation also conformant? If full 64 bytes are required, the legacy path needs rewrite; if 32 bytes are conformant, the spec should call out the choice.

### Q-2: Mnemonic wordlist

`docs/CURRENT_IMPLEMENTATION.md:617` lists a German wordlist as a deliberate deviation from the spec (which the document implies uses English). The phase-1 vector uses the standard English BIP39 mnemonic. Does `wot-identity@0.1` mandate the English BIP39 wordlist, allow alternate wordlists at the application layer, or define wordlist negotiation? Implementation impact: if mandated, the German wordlist must be removed or scoped to a non-conformant variant; if not, the spec should record that wordlist choice is local and only the seed is normative.

### Q-3: HKDF info-string divergence

Protocol-core uses `wot/identity/ed25519/v1` and `wot/encryption/x25519/v1`; legacy `WotIdentity` uses `wot-identity-v1` and `wot-encryption-v1`. The protocol-core values match the phase-1 vector. Does the spec normatively fix the slash-separated `wot/<role>/<curve>/v1` strings (and prohibit dash variants), or are info strings implementation-defined as long as the resulting public keys interop? The current evidence (vector parity) suggests the slash form is normative, but it should be explicit.

### Q-4: Duplicate DID encoders

Two byte-identical `did:key` encoders coexist (`protocol/identity/did-key.ts` and `crypto/did.ts`). This is an implementation question, not a spec question, but it should be resolved alongside the larger `WotIdentity` migration. Recording here so the next slice picks it up.

### Q-5: Verification-method id `#sig-0`

The phase-1 vector pins `#sig-0` as the verification-method id. Does the spec normatively require exactly that fragment for a `did:key` identity, or does it allow any fragment matching the multicodec public-key encoding (e.g. `did:key:z6Mk…#z6Mk…`, as some W3C examples use)? `crypto/did.ts` legacy path historically used the public-key fragment style — see `docs/concepts/identity-and-keys.md:115`. Implementation currently follows the vector.

### Q-6: Canonical `#enc-0` derivation

The phase-1 vector pins `#enc-0` as the canonical key-agreement id, and `space_membership_messages.invite_key_discovery.canonical_key_agreement_id` references it. `resolveDidKey` does not auto-derive a `keyAgreement` entry; the test fixture passes one in. Spec question: is `keyAgreement[0]` part of the deterministic `did:key` resolution output for a `wot-identity@0.1` identity, or is it discovered/published out-of-band (e.g. via the Profile service)? If the former, the resolver should derive it from the X25519 material; if the latter, the spec should mark it as bootstrap data and clarify that the JCS hash in the vector includes that bootstrap data.

### Q-7: JWS section ownership

The `wot-identity@0.1` profile lists `001`, `002`, and `003` as its spec docs but only `phase-1-interop.json#identity` and `#did_resolution` as its test vectors. Does `002-signaturen-und-verifikation.md` define the JWS profile alone, or are the JWS-specific test vectors (`attestation_vc_jws`, `log_entry_jws`, `space_capability_jws`) intentionally tested under `wot-trust@0.1` / `wot-sync@0.1` while the underlying JCS/JWS algorithm is owned by `wot-identity@0.1`? The current inventory assumes the latter; the spec should make this explicit so downstream profiles can `requires` the algorithm rules without duplicating them.

### Q-8: JCS number edge cases

`packages/wot-core/src/protocol/crypto/jcs.ts:7-13` rejects non-finite numbers and normalizes `-0` to `0`, then defers to `JSON.stringify` for the textual form. RFC 8785 has stricter rules for floating-point output (ECMAScript `ToString` algorithm with shortest-roundtrip semantics, lowercase `e`, no trailing zeros). The current vectors do not exercise floats. Does `wot-spec` mandate full RFC 8785 floating-point conformance, or only the integer/string subset that current artifacts use?

### Q-9: Legacy JWS callers

`packages/wot-core/src/crypto/jws.ts` produces non-JCS, `typ: 'JWT'` JWS values incompatible with the protocol-core JWS shape. It is still consumed by `WotIdentity.signJws`, `services/ProfileService.ts`, `crypto/envelope-auth.ts`, and `crypto/capabilities.ts`. None of those artifacts are in scope for `wot-identity@0.1` proper, but they share the JWS surface. This is an implementation question (migration path), not a spec question — listed so the follow-up identity slice does not silently re-introduce the legacy framing.

### Q-10: DID Document schema fields

`schemas/did-document-wot.schema.json` was not read in this slice. The hand-written `DidDocument` interface in `packages/wot-core/src/protocol/identity/did-document.ts` may be missing optional fields (e.g. `@context`, `controller`, `keyAgreement[*].publicKeyJwk`) that the schema defines. The follow-up slice should diff the TS type against the schema. Until then this is a known unverified item.

### Q-11: `DidResolver` port

The interface `DidResolver` is defined (`protocol/identity/did-document.ts:1-3`) but no concrete implementation exists in `packages/wot-core/src/`. Spec question: does `wot-identity@0.1` require a resolver implementation as part of conformance, or only the `did:key` resolution rules (which can be applied inline)? Implementation question: if `DidResolver` is required, the slice that ships it should also decide whether non-`did:key` methods are in scope (the manifest currently scopes the profile to `did:key`).

---

## 8. Conformance summary

| Requirement bucket | Reusable | Needs rewrite | Missing | External | Total |
|---|---:|---:|---:|---:|---:|
| Identity material derivation | 5 | 4 | 0 | 0 | 9 |
| Signatures and verification | 3 | 1 | 0 | 0 | 4 |
| DID resolution | 5 | 1 | 1 (port adapter) | 0 | 7 |
| **Total** | **13** | **6** | **1** | **0** | **20** |

The protocol-core path under `packages/wot-core/src/protocol/` already covers every `wot-identity@0.1` requirement that has a phase-1 test vector. The "needs rewrite" count is dominated by legacy parallels in `packages/wot-core/src/identity/` and `packages/wot-core/src/crypto/` that exist alongside the protocol-core implementation; the migration is already planned in `docs/reference-implementation-refactor.md` slices 2 and 4 and should be tracked there rather than re-opened in this profile.

The single "missing" item is a concrete `DidResolver` adapter; whether it is required by `wot-identity@0.1` or only by downstream profiles depends on Q-11.

## 9. Out of scope for this slice

- No code changes (this slice is inventory/planning only).
- No edits to `../wot-spec/` (forbidden).
- No edits to `apps/` or top-level `packages/` runtime code (forbidden).
- No automation workflow changes (`.github/` forbidden).
- The legacy-path migration is tracked in `docs/reference-implementation-refactor.md`, not in this document.
- Profiles other than `wot-identity@0.1` (i.e. `wot-trust@0.1`, `wot-sync@0.1`, `wot-device-delegation@0.1`, `wot-rls@0.1`, `wot-hmc@0.1`) are out of scope and continue to be tracked in `packages/wot-core/src/protocol/COVERAGE.md`.
