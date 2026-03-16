# Sync Architecture

> How data flows between devices, services, and users in Web of Trust.

**Status:** Implemented
**Last updated:** 2026-03-16

---

## Four-Way Architecture

Web of Trust uses four complementary sync paths. Each serves a different purpose:

```mermaid
graph TD
    App[App / CRDT Engine]

    CS[CompactStore<br/>IndexedDB]
    R[Relay<br/>WebSocket]
    V[Vault<br/>HTTP]
    P[wot-profiles<br/>HTTP]

    App -->|immediate| CS
    App -->|immediate| R
    App -->|5s debounce| V
    App -->|on profile change| P

    CS -->|on app start| App
    R -->|real-time| App
    V -->|on new device| App
    P -->|on seed restore| App

    style CS fill:#e8f5e9
    style R fill:#e3f2fd
    style V fill:#fff3e0
    style P fill:#f3e5f5
```

| Path | Transport | Purpose | Latency | Encryption |
|------|-----------|---------|---------|------------|
| **CompactStore** | IndexedDB | Local persistence | Immediate | At-rest (passphrase) |
| **Relay** | WebSocket | Real-time device-to-device sync | ~100ms | E2EE (envelope auth) |
| **Vault** | HTTPS | Encrypted backup & new device restore | 5s debounce | E2EE (AES-256-GCM) |
| **wot-profiles** | HTTPS | Public profile discovery | On change | JWS-signed (public) |

---

## Data Flow: Write

When the user makes a change (e.g., edits profile, adds contact):

```mermaid
sequenceDiagram
    participant User
    participant App
    participant CRDT as CRDT Engine<br/>(Yjs / Automerge)
    participant CS as CompactStore<br/>(IndexedDB)
    participant Relay as Relay<br/>(WebSocket)
    participant Vault as Vault<br/>(HTTP)

    User->>App: Edit profile
    App->>CRDT: Mutate Y.Doc
    CRDT->>CS: Save snapshot (immediate)
    CRDT->>Relay: Send encrypted update (immediate)
    CRDT->>Vault: Push snapshot (5s debounce)
    App->>User: UI updates instantly

    Note over CS: Crash-safe baseline
    Note over Relay: Other devices get update in ~100ms
    Note over Vault: Backup for new device restore
```

**Key design decisions:**
- **No debounce on Relay** — real-time sync is critical for multi-device UX
- **5s debounce on Vault** — reduces HTTP requests, Vault is backup not real-time
- **Immediate CompactStore** — crash-safe, always has latest state

## Data Flow: Read (App Start)

When the app starts, it loads data from the fastest available source:

```mermaid
flowchart TD
    Start([App Start]) --> CS{CompactStore<br/>has data?}

    CS -->|Yes| Load[Load from CompactStore<br/>~4ms IDB read]
    CS -->|No| Vault{Vault<br/>reachable?}

    Vault -->|Yes| Restore[Restore from Vault<br/>decrypt + apply]
    Vault -->|No| Profiles{wot-profiles<br/>has profile?}

    Profiles -->|Yes| Bootstrap[Bootstrap from profile<br/>+ verified contacts]
    Profiles -->|No| New[Empty doc<br/>first-time user]

    Load --> Connect[Connect to Relay]
    Restore --> Connect
    Bootstrap --> Connect
    New --> Connect

    Connect --> Sync[Receive queued messages<br/>from Relay]

    style Load fill:#e8f5e9
    style Restore fill:#fff3e0
    style Bootstrap fill:#f3e5f5
    style New fill:#fafafa
```

**Fallback chain:** CompactStore → Vault → wot-profiles → empty doc

---

## Offline-First Behavior

### Everything works offline

All mutations happen locally first. The CRDT engine (Yjs or Automerge) handles conflict resolution automatically — no vector clocks, no manual merge, no server-side logic.

```
User edits profile while offline
    → CRDT mutated locally
    → CompactStore updated
    → Relay message queued (Outbox)
    → Vault push deferred

User comes online
    → Outbox flushes to Relay
    → Relay delivers queued messages from other devices
    → CRDT merges automatically
    → Vault receives latest snapshot
```

### Outbox Pattern

Messages that can't be delivered (offline, relay down) are queued in the Outbox:

```mermaid
sequenceDiagram
    participant App
    participant Outbox as Outbox<br/>(PersonalDoc)
    participant Relay as Relay

    App->>Outbox: Enqueue message
    Note over Outbox: Persisted in CRDT

    loop Every reconnect
        Outbox->>Relay: Send pending messages
        Relay->>Outbox: ACK
        Outbox->>Outbox: Dequeue on ACK
    end
```

### Relay ACK Protocol

The Relay persists messages until the recipient ACKs them. If a device disconnects before ACK, messages are redelivered on reconnect:

```mermaid
sequenceDiagram
    participant Alice
    participant Relay
    participant Bob

    Alice->>Relay: Send message to Bob
    Relay->>Relay: Persist in SQLite

    alt Bob is online
        Relay->>Bob: Deliver message
        Bob->>Relay: ACK (message_id)
        Relay->>Relay: Delete from queue
    else Bob is offline
        Note over Relay: Message stays in queue
        Note over Bob: Later...
        Bob->>Relay: Connect + register
        Relay->>Bob: Redeliver queued messages
        Bob->>Relay: ACK
    end
```

---

## Encryption Layers

### Personal Doc (Multi-Device)

Same user, multiple devices. Encrypted with the user's personal key derived from BIP39 seed:

```
CRDT update → AES-256-GCM encrypt (personal key) → Relay → decrypt on other device
```

### Shared Spaces (Multi-User)

Multiple users collaborating. Encrypted with a shared group key:

```
CRDT update → AES-256-GCM encrypt (group key) → Relay → decrypt by group members
```

Group keys are managed by `GroupKeyService` with generation tracking for key rotation.

### Attestations (1:1 Delivery)

One sender, one recipient. Encrypted with recipient's public key (X25519 ECIES):

```
Attestation → ECIES encrypt (recipient public key) → Relay → decrypt by recipient
```

### Public Profiles

Not encrypted — intentionally public. Signed with Ed25519 (JWS) for authenticity:

```
Profile → JWS sign (private key) → wot-profiles server → anyone can verify
```

---

## CRDT Conflict Resolution

We use **Yjs** (default) or **Automerge** (option) for conflict-free merging. No manual conflict resolution needed.

| Data type | CRDT type | Conflict behavior |
|-----------|-----------|-------------------|
| Profile fields | Y.Map | Last writer wins (Lamport timestamp) |
| Contacts | Y.Map | Last writer wins per field |
| Attestations | Y.Map | Add-only (recipient stores) |
| Verifications | Y.Map | Add-only (immutable once created) |
| Outbox | Y.Map | Add/remove (dequeue on ACK) |
| Space metadata | Y.Map | Last writer wins |

### Why no Vector Clocks?

Yjs and Automerge use internal logical clocks (Lamport timestamps) for ordering. The CRDT handles merge semantics automatically. We don't implement external vector clocks — the CRDT is the source of truth.

---

## Services

### Relay Server (`wss://relay.utopia-lab.org`)

- **Package:** `@real-life/wot-relay`
- **Role:** Real-time message forwarding with delivery guarantee
- **Storage:** SQLite (message queue until ACK)
- **Auth:** Envelope auth (Ed25519 signed envelopes)
- **Sees:** Encrypted bytes, sender/recipient DIDs, timestamps
- **Cannot see:** Message content (E2EE)

### Vault Server (`https://vault.utopia-lab.org`)

- **Package:** `@real-life/wot-vault`
- **Role:** Encrypted document backup for new device restore
- **Storage:** SQLite (encrypted snapshots)
- **Auth:** Signed capability tokens
- **Pattern:** Snapshot-replace (not incremental)

### Profile Server (`https://profiles.utopia-lab.org`)

- **Package:** `@real-life/wot-profiles`
- **Role:** Public profile discovery (name, bio, avatar, verified contacts)
- **Storage:** SQLite (JWS-signed profiles)
- **Auth:** JWS verification (DID → public key → verify signature)

---

## Performance

### Yjs vs Automerge on Mobile

| Metric (Large doc, 500 contacts) | Yjs | Automerge |
|----------------------------------|-----|-----------|
| **Init (load from IDB)** | 85ms | 6.4s |
| **Mutate 100 contacts** | 3ms | 1.9s |
| **Serialize (snapshot)** | 112ms | 819ms |
| **Bundle size** | 69KB | 1.7MB (WASM) |

Yjs is the default since 2026-03-15 due to 10-76x better performance on mobile. See `/benchmark` page for live measurements on any device.

### Why Automerge is slow on mobile

Automerge compiles Rust to WASM. On mobile ARM chips (especially hardened browsers like Vanadium/GrapheneOS), WASM execution is significantly slower than native JavaScript. Yjs is pure JavaScript — no WASM, no compilation overhead.

---

*Replaces: sync-protocol.md (2026-02-08), 05-sync-technical.md (2026-02-08)*
*These described a planned Vector Clock + REST architecture that was never implemented.*
