# Agent Task Contract

Status: operational, non-normative.

An agent task contract is the smallest unit of autonomous work. It tells an agent what to do, what not to touch, how to verify the result, and when to stop for a human gate.

## Required Shape

```yaml
id: sdk-boundaries-ports
title: Move SDK ports into core ports layer
repo: web-of-trust
base: spec-vnext
type: refactor
priority: high
goal: >
  Move adapter interfaces out of adapters/interfaces and expose them through
  @web_of_trust/core/ports without changing runtime behavior.
spec_refs:
  - wot-spec/IMPLEMENTATION-ARCHITECTURE.md
allowed_scope:
  - packages/wot-core/src/ports
  - packages/wot-core/src/adapters
  - packages/adapter-yjs/src
  - packages/adapter-automerge/src
forbidden_scope:
  - wot-spec normative documents
  - production deployment files
acceptance:
  - No imports from @web_of_trust/core/adapters/interfaces remain.
  - Ports do not import from application.
  - Existing root exports remain compatible unless explicitly approved.
checks:
  - pnpm --filter @web_of_trust/core typecheck
  - pnpm --filter @web_of_trust/core test
  - pnpm --filter @web_of_trust/core build
reviewers:
  - architecture
  - tests
human_gates:
  - Public API breaking change
  - Protocol behavior change
notes: []
```

## Field Rules

| Field | Rule |
| --- | --- |
| `id` | Stable kebab-case identifier. |
| `repo` | Repository that receives the branch. |
| `base` | Base branch for the task branch. |
| `type` | One of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `release`, `research`. |
| `goal` | One outcome, not a bundle of unrelated work. |
| `spec_refs` | Files, PRs, issues, or decisions that constrain the task. |
| `allowed_scope` | Paths the agent may change without asking. |
| `forbidden_scope` | Paths or behaviors that require human approval. |
| `acceptance` | Observable outcomes reviewers can verify. |
| `checks` | Commands the implementer must run when feasible. |
| `reviewers` | Review roles required before integration. |
| `human_gates` | Conditions that stop automation. |

## Stop Conditions

The implementer must stop and report when:

- A human gate is triggered.
- Required checks cannot run locally.
- The allowed scope is insufficient.
- The task conflicts with unrelated worktree changes.
- The spec reference is ambiguous or contradictory.
- The implementation would require a larger architectural decision than the contract allows.

## Completion Criteria

A task is complete when:

- The branch contains only task-scoped changes.
- Acceptance criteria are satisfied or explicitly marked as blocked.
- Required checks ran or are documented as unavailable.
- A PR exists with a summary, verification list, and residual risks.
- Automated review packets have been generated or requested.
