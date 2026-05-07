# WoT Trust Conformance Notes

This document tracks reference-implementation coverage for `wot-trust@0.1`. It is non-normative; `../wot-spec/02-wot-trust/` remains the authority.

## Trust 002 Online Verification

- **Spec refs:** `../wot-spec/02-wot-trust/002-verifikation.md`, `../wot-spec/schemas/qr-challenge.schema.json`, and the QR challenge valid/invalid schema examples.
- **Implementation:** `packages/wot-core/src/protocol/trust/qr-challenge.ts` owns raw QR parsing and already-verified Verification-Attestation acceptance decisions. `packages/wot-core/src/application/verification/verification-workflow.ts` owns application state: QR challenge creation, active challenge tracking, and volatile consumed nonce history.
- **Tests:** `packages/wot-core/tests/ProtocolInterop.test.ts` covers protocol parsing and acceptance decisions. `packages/wot-core/tests/VerificationWorkflow.test.ts` covers application QR creation, optional broker serialization, active challenge reset, nonce consumption, replay rejection, 24-hour pruning, expired challenge rejection, and restart-safe remote/unbound classification.
- **Boundaries:** The application acceptance method consumes an already-verified `AttestationVcPayload`. It does not verify VC-JWS signatures, send messages, persist nonce history, update contacts, publish discovery records, or define delivery/ack behavior.
- **Open questions:** None surfaced in this application slice.
