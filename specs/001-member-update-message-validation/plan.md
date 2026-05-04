# Implementation Plan: Member-Update Message Validation

**Branch**: `experiment/spec-kit-langgraph` | **Date**: 2026-05-04 | **Spec**: `specs/001-member-update-message-validation/spec.md`
**Input**: Feature specification from `/specs/001-member-update-message-validation/spec.md`

## Summary

Implement a small `wot-sync@0.1` conformance slice in `@web_of_trust/core`: create and validate `member-update/1.0` DIDComm plaintext messages using the normative `wot-spec` schema shape, expose the helper through the protocol package, and prove behavior with targeted interop tests.

## Technical Context

**Language/Version**: TypeScript 5.7 on Node.js >=20
**Primary Dependencies**: pnpm workspace, Turbo, Vite library build, Vitest, existing `@web_of_trust/core` protocol package
**Storage**: N/A
**Testing**: Vitest via `pnpm --filter @web_of_trust/core test -- ProtocolInterop`, TypeScript via `typecheck`, Vite via `build`
**Target Platform**: TypeScript reference library consumed by web/demo packages and Vault vendored dist
**Project Type**: pnpm monorepo library slice
**Performance Goals**: Validation is synchronous and lightweight; no new async or storage path
**Constraints**: No normative spec changes, no app changes, no auto-merge, human gate for membership semantics ambiguity
**Scale/Scope**: One protocol message helper plus targeted tests and required generated dist refresh if output changes

## Constitution Check

*GATE: Must pass before implementation. Re-check after task generation.*

PASS. The slice cites `wot-spec` as normative source, is independently testable, has explicit allowed and forbidden scopes, uses existing TypeScript package structure, and stops before human-controlled merge.

Human gates remain active for any change to membership semantics, crypto behavior, DID/JWS semantics, breaking protocol exports, or normative `wot-spec` content.

## Project Structure

### Documentation (this feature)

```text
specs/001-member-update-message-validation/
|-- spec.md
|-- plan.md
`-- tasks.md
```

### Source Code (repository root)

```text
packages/wot-core/src/protocol/
|-- index.ts
`-- sync/
    `-- membership-messages.ts

packages/wot-core/tests/
`-- ProtocolInterop.test.ts

packages/wot-vault/
|-- docker-build.sh
`-- wot-core-dist/
```

**Structure Decision**: Use the existing `@web_of_trust/core` protocol package and protocol interop test file. Refresh `packages/wot-vault/wot-core-dist` only when the core distribution consumed by Vault changes.

## Complexity Tracking

No constitution violations are expected for this slice.
