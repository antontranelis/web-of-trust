# Spec-vNext Target Architecture

> Nicht normativ. Dieses Dokument beschreibt das gemeinsame Zielbild fuer die TypeScript-Referenzimplementierung. Normative Anforderungen stehen in `wot-spec` und `CONFORMANCE.md`.

**Status:** Entwurf  
**Datum:** 2026-05-02  
**Scope:** `web-of-trust` PR #7 / `spec-vnext`
**Protocol-level counterpart:** `wot-spec/research/sync-zielarchitektur.md`

## Ziel

Die Referenzimplementierung soll die Spec-Struktur widerspiegeln: Protokollregeln werden deterministisch umgesetzt, Application-Workflows orchestrieren Verhalten, Ports beschreiben Infrastrukturfaehigkeiten und Adapter kapseln konkrete Technologien wie Yjs, Relay, Vault oder Browser-Storage.

Der wichtigste Architekturwechsel: **Yjs ist zukuenftig nur noch CRDT-Engine/Adapter, nicht die Sync-State-Machine.**

## Schichten

```mermaid
flowchart TB
  subgraph Spec["wot-spec (normativ)"]
    SIdentity["01 wot-identity"]
    STrust["02 wot-trust"]
    SSync["03 wot-sync"]
    SConformance["CONFORMANCE.md"]
    SVectors["schemas + test vectors"]
  end

  subgraph Core["packages/wot-core"]
    Protocol["protocol\nDeterministische Spec-Primitive"]
    Application["application\nUse-Cases + Sync-State-Machine"]
    Ports["ports\nkleine Infrastruktur-Interfaces"]
    Services["services\nuebergangsweise Runtime-Services"]
  end

  subgraph Adapters["packages/* adapters"]
    Yjs["adapter-yjs\nCRDT Doc Adapter"]
    Automerge["adapter-automerge\nalternative CRDT Engine"]
    RelayClient["WebSocketMessagingAdapter\nRelay Transport"]
    VaultClient["VaultClient\nSnapshot/Backup"]
    Storage["IndexedDB / PersonalDoc / SQLite\nStores"]
    Profiles["HttpDiscoveryAdapter\nwot-profiles"]
  end

  subgraph Apps["apps"]
    ReactHooks["React hooks\nUI-friendly state"]
    Demo["demo app\nComposition Root"]
    CLI["wot-cli\nComposition Root"]
  end

  Spec -->|normiert| Protocol
  SVectors -->|testen| Protocol
  SConformance -->|Akzeptanzkriterien| Application

  Protocol --> Application
  Ports --> Application
  Services -.->|wird abgebaut / extrahiert| Application

  Yjs -->|implementiert| Ports
  Automerge -->|implementiert| Ports
  RelayClient -->|implementiert| Ports
  VaultClient -->|implementiert| Ports
  Storage -->|implementiert| Ports
  Profiles -->|implementiert| Ports

  Application --> ReactHooks
  ReactHooks --> Demo
  Application --> CLI
  Demo -->|verdrahtet Adapter| Adapters
  CLI -->|verdrahtet Adapter| Adapters

  classDef normative fill:#e8f0ff,stroke:#2563eb,stroke-width:2px
  classDef core fill:#ecfdf5,stroke:#059669,stroke-width:2px
  classDef adapter fill:#fff7ed,stroke:#f59e0b,stroke-width:2px
  classDef app fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px

  class SIdentity,STrust,SSync,SConformance,SVectors normative
  class Protocol,Application,Ports,Services core
  class Yjs,Automerge,RelayClient,VaultClient,Storage,Profiles adapter
  class ReactHooks,Demo,CLI app
```

## Dependency-Regeln

```mermaid
flowchart LR
  Protocol["protocol"] -->|darf importieren| Nothing["keine App-/Storage-/Network-/React-Abhaengigkeiten"]
  Application["application"] --> Protocol
  Application --> Ports["ports"]
  React["wot-react / demo hooks"] --> Application
  App["demo / cli"] --> React
  App --> Application
  App --> Adapters["concrete adapters"]
  Adapters --> Ports
  Adapters --> Protocol

  Bad1["protocol -> application"]:::bad
  Bad2["application -> adapter"]:::bad
  Bad3["adapter-yjs entscheidet ACK-Semantik"]:::bad

  classDef bad fill:#fee2e2,stroke:#dc2626,stroke-width:2px
```

Regeln:

- `protocol` implementiert deterministische Spec-Primitive und Testvektoren.
- `application` implementiert Use-Cases und State-Machines gegen Ports.
- `ports` sind klein und technologieunabhaengig.
- `adapters` implementieren Ports und duerfen Plattform-/Library-Code enthalten.
- Apps sind Composition Roots und waehlen konkrete Adapter.
- React-Hooks duennen Application-Workflows fuer UI aus; sie enthalten keine Protokollautoritaet.

## Ziel-Komponenten

```mermaid
flowchart TB
  subgraph Application["application/sync"]
    SyncCoordinator["SyncCoordinator"]
    StartupFlow["Startup/Reconnect Flow"]
    InboxProcessor["InboxProcessor"]
    LogSync["LogCatchUpService"]
    KeyState["KeyDependencyResolver"]
    AckPolicy["AckPolicy"]
  end

  subgraph Ports["ports"]
    TransportPort["TransportPort\nsend / receive / ack / heads"]
    PendingInboxStore["PendingInboxStore\ncrash-safe blocked messages"]
    LogStore["LogStore\nper (docId, deviceId, seq)"]
    KeyStore["KeyStore\ngroup keys + generations"]
    DocStore["DocStore\nCRDT-agnostic updates"]
    SnapshotStore["SnapshotStore\noptional optimization"]
    ClockRandom["Clock / Random"]
  end

  subgraph Adapters["adapter implementations"]
    Relay["Relay/WebSocket"]
    IndexedDB["IndexedDB / SQLite / PersonalDoc"]
    YjsAdapter["YjsDocAdapter"]
    Vault["Vault Snapshot Adapter"]
  end

  SyncCoordinator --> StartupFlow
  SyncCoordinator --> InboxProcessor
  SyncCoordinator --> LogSync
  SyncCoordinator --> KeyState
  InboxProcessor --> AckPolicy

  StartupFlow --> TransportPort
  StartupFlow --> PendingInboxStore
  StartupFlow --> LogStore
  StartupFlow --> KeyStore

  InboxProcessor --> PendingInboxStore
  InboxProcessor --> KeyStore
  InboxProcessor --> DocStore
  InboxProcessor --> TransportPort

  LogSync --> TransportPort
  LogSync --> LogStore
  LogSync --> DocStore
  LogSync --> KeyStore
  LogSync --> SnapshotStore

  KeyState --> PendingInboxStore
  KeyState --> KeyStore
  KeyState --> TransportPort

  Relay --> TransportPort
  IndexedDB --> PendingInboxStore
  IndexedDB --> LogStore
  IndexedDB --> KeyStore
  YjsAdapter --> DocStore
  Vault --> SnapshotStore
```

## Rolle Von Yjs

```mermaid
flowchart LR
  SyncEngine["Application Sync Engine"] -->|decrypts + validates update| DocPort["DocStore Port"]
  DocPort --> YjsAdapter["YjsDocAdapter"]
  YjsAdapter --> YDoc["Y.Doc"]
  YjsAdapter --> Compact["CompactStore snapshot"]

  YjsAdapter -->|export update / state vector| SyncEngine
  SyncEngine -->|encrypt + sign + log| Transport["Transport / Log"]

  Forbidden1["ACK timing"]:::forbidden
  Forbidden2["blocked-by-key policy"]:::forbidden
  Forbidden3["future-rotation policy"]:::forbidden
  Forbidden4["PersonalDoc before Space order"]:::forbidden

  YjsAdapter -.->|darf nicht entscheiden| Forbidden1
  YjsAdapter -.->|darf nicht entscheiden| Forbidden2
  YjsAdapter -.->|darf nicht entscheiden| Forbidden3
  YjsAdapter -.->|darf nicht entscheiden| Forbidden4

  classDef forbidden fill:#fee2e2,stroke:#dc2626,stroke-width:2px
```

Yjs soll langfristig nur:

- lokale Space-Dokumente oeffnen und anlegen,
- CRDT-Updates anwenden,
- CRDT-Updates oder Snapshots exportieren,
- State Vectors bereitstellen,
- lokale Compact-Persistenz kapseln,
- Remote-Update-Events fuer UI ausloesen.

Yjs soll langfristig nicht:

- ACK-Zeitpunkte bestimmen,
- Pending-Inbox-Semantik definieren,
- Key-Rotation-Gaps aufloesen,
- Broker-/Relay-Catch-Up steuern,
- Personal-Doc-vor-Space-Abhaengigkeiten orchestrieren,
- Log-Heads vergleichen oder normative Sync-Recovery ersetzen.

## Startup Und Reconnect Ziel-Flow

```mermaid
sequenceDiagram
  participant App as App Composition Root
  participant Sync as SyncCoordinator
  participant Store as Local Stores
  participant Relay as TransportPort
  participant Personal as PersonalDoc Sync
  participant Spaces as Space Log Sync
  participant Pending as PendingInboxStore
  participant Keys as KeyStore
  participant CRDT as DocStore (Yjs)

  App->>Sync: start() / reconnect()
  Sync->>Store: load deviceId, heads, logs, pending, keys
  Sync->>Relay: authenticate did + deviceId
  Sync->>Relay: compare broker_seq/local_seq for PersonalDoc
  Sync->>Pending: restore durable pending messages
  Sync->>Relay: drain device Inbox
  Relay-->>Sync: inbox messages
  Sync->>Pending: apply or durable-buffer before ACK
  Sync->>Relay: ACK only after apply/buffer
  Sync->>Personal: sync-request PersonalDoc
  Personal->>Keys: import group keys and space metadata
  Sync->>Spaces: determine known active spaces
  loop each Space
    Sync->>Relay: compare broker_seq/local_seq
    Sync->>Relay: sync-request heads
    Relay-->>Sync: missing log entries
    Sync->>Keys: resolve keyGeneration
    alt key available
      Sync->>CRDT: apply decrypted CRDT update
      Sync->>Store: persist log + doc state
    else missing key
      Sync->>Pending: durable blocked-by-key
    end
  end
  Sync->>Pending: replay pending after key catch-up
  Sync-->>App: synced / stale / blocked state
```

## Write Ziel-Flow

```mermaid
sequenceDiagram
  participant UI
  participant App as Application Workflow
  participant CRDT as DocStore (Yjs)
  participant Keys as KeyStore
  participant Log as LogStore
  participant Transport as TransportPort
  participant Snapshot as SnapshotStore

  UI->>App: mutate space / personal doc
  App->>Transport: if online, head check for own (deviceId, docId)
  App->>Log: reserve next seq atomically
  App->>CRDT: create local CRDT update
  App->>Keys: current keyGeneration + content key
  App->>App: encrypt update + create Log-Entry-JWS
  App->>Log: persist log entry before publish
  App->>Transport: publish log entry / wake peers
  App->>Snapshot: optional debounced snapshot push
  App-->>UI: local state already updated
```

## Spec Mapping

| Spec | Normative responsibility | Target implementation |
|---|---|---|
| `01-wot-identity` | DID, key derivation, DID document/key agreement | `protocol/identity`, `application/identity`, `IdentityVault` port |
| `02-wot-trust` | Verifications, Attestations, VC-JWS | `protocol/trust`, `application/verification`, `application/attestations` |
| `03-wot-sync/001` | Space IDs, capabilities, content keys | `protocol/sync`, `KeyStore`, `CapabilityVerifier` |
| `03-wot-sync/002` | Log entries, startup/reconnect, local writes, pending, blocked-by-key, future-rotation | `application/sync/SyncCoordinator`, `LogStore`, `PendingInboxStore`, `KeyDependencyResolver` |
| `03-wot-sync/003` | Broker auth, per-device Inbox, ACK, sync-request/response | `TransportPort`, Relay adapter, `AckPolicy` |
| `03-wot-sync/004` | Transport envelope compatibility | `protocol/sync/envelope`, transport adapter tests |
| `03-wot-sync/005` | Groups, member-update, key-rotation generation rules | `application/spaces`, `KeyStore`, `KeyDependencyResolver` |
| `03-wot-sync/006` | Personal Doc, self-addressed multi-device sync, Personal Doc before Spaces | `application/sync/StartupFlow`, PersonalDoc adapter |
| `CONFORMANCE.md` | Profile-level acceptance criteria | CI conformance checklist + integration tests |
| Schemas/test vectors | Interop fixtures | Protocol tests imported or mirrored from `wot-spec` |

## Aktueller Uebergangszustand

```mermaid
flowchart TB
  YjsNow["YjsReplicationAdapter heute"] --> M1["Messaging"]
  YjsNow --> M2["GroupKeyService"]
  YjsNow --> M3["Space invite/member update"]
  YjsNow --> M4["Pending blocked messages"]
  YjsNow --> M5["Vault pull/push"]
  YjsNow --> M6["CRDT Doc"]

  Target["Ziel"] --> A1["SyncCoordinator"]
  Target --> A2["PendingInboxStore"]
  Target --> A3["KeyStore"]
  Target --> A4["TransportPort"]
  Target --> A5["SnapshotStore"]
  Target --> A6["YjsDocAdapter"]

  M1 -.->|extrahieren| A4
  M2 -.->|extrahieren| A3
  M3 -.->|extrahieren| A1
  M4 -.->|extrahieren| A2
  M5 -.->|extrahieren| A5
  M6 -.->|behalten| A6
```

Der aktuelle `YjsReplicationAdapter` bleibt als funktionierende Uebergangsimplementierung. Stabilitaetsfixes sind sinnvoll, wenn sie Datenverlust verhindern oder Spec-Invarianten absichern. Neue groessere Features sollten nicht weiter in diesen Adapter wachsen, sondern in Ports/Application-Workflows extrahiert werden.

## Migrationspfad

1. `PendingInboxStore` als Port einfuehren und die aktuelle CompactStore-basierte Pending-Logik aus `YjsReplicationAdapter` herausziehen.
2. `KeyStore` und `KeyDependencyResolver` einfuehren; `blocked-by-key` und `future-rotation` in Application-Tests abdecken.
3. `TransportPort` mit per-device ACK-Semantik und `sync-request`/`sync-response` als Application-Abhaengigkeit definieren.
4. `LogStore` fuer `(docId, deviceId, seq)` einfuehren; lokale Writes gehen zuerst ins Log, dann an Transport/Peers.
5. `YjsDocAdapter` auf `DocStore` reduzieren: apply/export/state-vector/snapshot/local persistence.
6. Timer-basierte Reconnect-Fixes durch dependency-aware Catch-Up ersetzen.
7. Vor Merge in `main`: Spec-Referenzen, CI-Checks und Reset-/Breaking-Release-Plan aktualisieren.

## Offene Architekturfragen

| Frage | Entscheidungstendenz |
|---|---|
| Soll `PendingInboxStore` im Personal Doc oder lokalem Store liegen? | Lokal crash-sicher als Minimum; Personal Doc nur fuer Daten, die zwischen eigenen Devices repliziert werden muessen. |
| Soll Vault Pending-Nachrichten sichern? | Nein als Norm. Vault bleibt Snapshot-/Backup-Optimierung, nicht Quelle fuer ACK-Sicherheit. |
| Soll Yjs Full-State weiterhin ueber Relay verschickt werden? | Uebergang ja. Langfristig nur Snapshot-/Catch-Up-Optimierung, nicht normativer Sync-Ersatz. |
| Brauchen wir `key-request`? | Nicht in `wot-sync@0.1`. Bestehende Quellen: Inbox, Personal Doc, Space Catch-Up, optionale Snapshots/Full-State. |
| Wann ist ein Adapter-Fix sinnvoll? | Wenn er eine Spec-Invariante absichert und spaeter extrahierbar ist. Keine neuen grossen Verantwortungen im Adapter. |
