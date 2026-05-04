# Feature Specification: Member-Update Message Validation

**Feature Branch**: `experiment/spec-kit-langgraph`
**Spec ID**: `001-member-update-message-validation`
**Created**: 2026-05-04
**Status**: Draft
**Input**: Implementation slice for validating `member-update/1.0` DIDComm plaintext messages against `wot-spec`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Member-Update Messages (Priority: P1)

An implementer or downstream package can create and parse `member-update/1.0` DIDComm plaintext messages through `@web_of_trust/core/protocol` and receive deterministic validation failures for messages that violate the normative schema.

**Why this priority**: The membership update message is part of the `wot-sync@0.1` conformance profile and is required before higher-level group membership sync can be safely automated.

**Independent Test**: Run the targeted core protocol interop test and confirm valid member-update vectors pass while invalid body shapes fail.

**Acceptance Scenarios**:

1. **Given** a DIDComm plaintext message with `typ` `application/didcomm-plain+json`, `type` `https://web-of-trust.de/protocols/member-update/1.0`, and a valid body, **When** it is parsed, **Then** the result exposes a typed member-update message.
2. **Given** a member-update body with action `added` or `removed`, **When** it is validated, **Then** the body is accepted.
3. **Given** a member-update body with any other action or extra body property, **When** it is validated, **Then** validation fails with a deterministic error.

---

### User Story 2 - Preserve Human-Controlled Conformance (Priority: P2)

A maintainer can review the implementation against the exact `wot-spec` references, the allowed file scope, and the required checks before deciding whether to merge.

**Why this priority**: Member updates affect group membership semantics; automation must make the compliance evidence visible without merging on its own.

**Independent Test**: Inspect the task list, generated runner prompt, and check results to confirm the work stops before merge and cites the normative source files.

**Acceptance Scenarios**:

1. **Given** the implementation touches protocol code, **When** the task is completed, **Then** core tests, typecheck, build, and diff whitespace checks are available to the reviewer.
2. **Given** a change would alter normative `wot-spec` behavior, **When** the ambiguity is detected, **Then** the process stops at a human-decision gate.

### Edge Cases

- Missing or wrong DIDComm `typ` must be rejected.
- Missing or wrong member-update `type` must be rejected.
- Empty or malformed `to` recipients must be rejected.
- Negative `created_time` or `effectiveKeyGeneration` must be rejected.
- Body properties outside `spaceId`, `action`, `memberDid`, `effectiveKeyGeneration`, and optional `reason` must be rejected.
- Top-level DIDComm extension properties remain allowed because the normative schema has `additionalProperties: true` at the envelope level.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The implementation MUST trace validation behavior to `wot-spec/schemas/member-update.schema.json` and `wot-spec/03-wot-sync/005-gruppen.md`.
- **FR-002**: The implementation MUST export member-update helpers and types through `@web_of_trust/core/protocol`.
- **FR-003**: The implementation MUST accept only DIDComm plaintext envelope `typ` `application/didcomm-plain+json` for this message.
- **FR-004**: The implementation MUST accept only message `type` `https://web-of-trust.de/protocols/member-update/1.0`.
- **FR-005**: The implementation MUST accept only body action values `added` and `removed`.
- **FR-006**: The implementation MUST reject extra properties inside `body`.
- **FR-007**: The implementation MUST include targeted protocol interop tests for valid and invalid member-update messages.
- **FR-008**: The implementation MUST NOT modify `wot-spec` as part of this slice.
- **FR-009**: If core build output consumed by Vault changes, the implementation MUST refresh `packages/wot-vault/wot-core-dist` using `packages/wot-vault/docker-build.sh`.

### Key Entities

- **MemberUpdateMessage**: DIDComm plaintext envelope with `id`, `typ`, `type`, `from`, `to`, `created_time`, optional threading fields, and `body`.
- **MemberUpdateBody**: Message body containing `spaceId`, `action`, `memberDid`, `effectiveKeyGeneration`, and optional `reason`.
- **Conformance Evidence**: Test output and reviewer-visible references proving alignment with the normative schema and vectors.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `pnpm --filter @web_of_trust/core test -- ProtocolInterop` passes with member-update valid and invalid cases covered.
- **SC-002**: `pnpm --filter @web_of_trust/core typecheck` passes.
- **SC-003**: `pnpm --filter @web_of_trust/core build` passes.
- **SC-004**: `git diff --check` reports no whitespace errors.
- **SC-005**: The PR or runner state includes the `wot-spec` schema and document references used for validation.

## Assumptions

- This is an implementation spec only; `wot-spec` remains the normative source.
- The slice targets `@web_of_trust/core` protocol validation, not the full group membership synchronization flow.
- The local automation runner defaults to dry-run and does not open or merge PRs unless explicitly configured.
