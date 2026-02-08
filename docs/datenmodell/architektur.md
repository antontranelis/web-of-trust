# Architektur

> Framework-agnostische Architektur des Web of Trust
>
> Aktualisiert: 2026-02-08 (v2: 6-Adapter-Architektur)

## Überblick

Das Web of Trust ist **framework-agnostisch** aufgebaut. Die Kernlogik ist unabhängig von der konkreten Implementierung der Datenhaltung, Kryptografie, Messaging und Synchronisation.

### Schichtenmodell (v2)

```
┌─────────────────────────────────────────────────────────────┐
│                     WoT Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WoT Domain Layer                        │   │
│  │  • Identity, Contact, Verification, Attestation     │   │
│  │  • Item, Group, AutoGroup                           │   │
│  │  • Business Logic (Empfänger-Prinzip)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           6 Adapter Interfaces                       │   │
│  │                                                      │   │
│  │  Bestehend (v1, implementiert):                      │   │
│  │  • StorageAdapter        (lokale Persistenz)         │   │
│  │  • ReactiveStorageAdapter (Live Queries)             │   │
│  │  • CryptoAdapter         (Signing/Encryption/DID)    │   │
│  │                                                      │   │
│  │  Neu (v2):                                           │   │
│  │  • MessagingAdapter      (Cross-User Delivery)       │   │
│  │  • ReplicationAdapter    (CRDT Sync + Spaces)        │   │
│  │  • AuthorizationAdapter  (UCAN-like Capabilities)    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│     ┌─────────┬───────────┼───────────┬─────────┐          │
│     ▼         ▼           ▼           ▼         ▼          │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│  │Evolu  │ │WebSock│ │Auto-  │ │Matrix │ │Custom │       │
│  │Storage│ │Relay  │ │merge  │ │Client │ │UCAN   │       │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Zwei orthogonale Achsen

```
CRDT/Sync-Achse                    Messaging-Achse
(Zustandskonvergenz)               (Zustellung zwischen DIDs)

"Wie konvergiert der Zustand        "Wie erreicht eine Nachricht
 über Geräte und Nutzer?"            den Empfänger?"

→ ReplicationAdapter                → MessagingAdapter
→ Evolu (POC) / Automerge (Ziel)   → Custom WS (POC) / Matrix (Ziel)

Eine Nachricht enthält NICHT den Zustand, sondern nur den Trigger/Pointer.
Der Zustand lebt im CRDT und konvergiert unabhängig.
```

## Adapter-Pattern

Die Adapter-Interfaces ermöglichen es, verschiedene Frameworks auszuprobieren, ohne die Kernlogik zu ändern.

### Warum Framework-agnostisch?

1. **Kein Framework passt zu 100%** — WoT-spezifische Anforderungen erfordern eigene Implementierung
2. **Zwei verschiedene Achsen** — CRDT/Sync und Messaging sind orthogonale Probleme
3. **Technologie-Landschaft bewegt sich** — NextGraph, p2panda, Willow könnten in 12 Monaten reif sein
4. **Phased Migration** — Custom WS → Matrix, Evolu → Automerge ohne Business-Logik-Änderung
5. **Testing** — Einfaches Mocking für Unit-Tests (NoOp-Implementierungen)

## Kernkonzepte

### Empfänger-Prinzip

Das zentrale Designprinzip: **Daten werden beim Empfänger gespeichert.**

```
Anna → Verification → Ben
       └─────────────────┘
       Gespeichert bei Ben

Anna → Attestation → Ben
       └────────────────┘
       Gespeichert bei Ben
```

**Warum?**
- Jeder kontrolliert seine eigenen Daten
- Keine Konflikte beim Schreiben (jeder schreibt nur in seinen eigenen Speicher)
- Einfachere CRDT-Konfliktauflösung
- Privacy: Ich entscheide, was über mich sichtbar ist

### Drei Sharing-Patterns

Die Architektur unterstützt drei fundamental verschiedene Sharing-Patterns:

```
1. GROUP SPACES (Kanban, Kalender, Karte)
   Mechanismus: ReplicationAdapter (CRDT Sync)
   Verschlüsselung: Group Key
   → Alle Members sehen alle Daten im Space

2. SELECTIVE SHARING (Event für 3 von 10 Kontakten)
   Mechanismus: MessagingAdapter (Item-Key Delivery)
   Verschlüsselung: Item-Key pro Item, encrypted per Recipient
   → Nur ausgewählte Empfänger können entschlüsseln

3. 1:1 DELIVERY (Attestation, Verification)
   Mechanismus: MessagingAdapter (Fire-and-forget)
   Verschlüsselung: E2EE mit Empfänger-PublicKey
   → Empfänger-Prinzip: gespeichert beim Empfänger
```

### Verification = Gegenseitige Bestätigung

Eine Verification ist eine signierte Aussage: "Ich habe diese Person verifiziert."

```
Anna verifiziert Ben:
┌────────────────────────────────────┐
│ Verification                       │
│ from: did:key:anna                 │
│ to: did:key:ben    ← Speicherort   │
│ proof: anna_signature              │
└────────────────────────────────────┘
→ Gespeichert bei Ben

Ben verifiziert Anna:
┌────────────────────────────────────┐
│ Verification                       │
│ from: did:key:ben                  │
│ to: did:key:anna   ← Speicherort   │
│ proof: ben_signature               │
└────────────────────────────────────┘
→ Gespeichert bei Anna
```

Jede Richtung ist ein **separates Dokument** mit **einer Signatur**.

### Attestation = Geschenk

Eine Attestation ist eine signierte Aussage über jemanden - wie ein Geschenk.

```
┌────────────────────────────────────┐
│ Attestation (signiert von Anna)    │
│ from: did:key:anna                 │
│ to: did:key:ben    ← Speicherort   │
│ claim: "Kann gut kochen"           │
│ proof: anna_signature              │
└────────────────────────────────────┘
→ Gespeichert bei Ben
→ Ben entscheidet: accepted = true/false
```

**Wichtig:** Das `accepted`-Flag ist **nicht** Teil des signierten Dokuments. Es ist lokale Metadaten, die nur der Empfänger kontrolliert.

### Contact = Lokaler Cache

Ein Contact speichert den Public Key einer verifizierten Person für E2E-Verschlüsselung.

```
Contact {
  did: "did:key:ben"
  publicKey: "..."        // Für Verschlüsselung
  status: "active"        // pending | active
}
```

## Adapter Interfaces

Die konkreten Interface-Definitionen befinden sich in `packages/wot-core/src/adapters/interfaces/`.

### Bestehend (v1, implementiert)

#### StorageAdapter

Verantwortlich für:
- Persistierung aller Daten (Identity, Contacts, Verifications, Attestations)
- Lokale Metadaten (AttestationMetadata mit `accepted`)

**Implementierungen:**
- `EvoluStorageAdapter` (Demo-App) - aktiv genutzt
- `LocalStorageAdapter` (IndexedDB) - in wot-core

#### ReactiveStorageAdapter

Verantwortlich für:
- Live Queries die auf Datenänderungen reagieren
- Mapped auf React's `useSyncExternalStore` via `Subscribable<T>`

**Implementierungen:**
- `EvoluStorageAdapter` (implementiert beide Interfaces)

#### CryptoAdapter

Verantwortlich für:
- Key-Generierung (Ed25519)
- Mnemonic / Recovery Phrase (BIP39, deutsche Wortliste)
- Signieren und Verifizieren
- Verschlüsselung (X25519 + AES-256-GCM)
- DID-Konvertierung (did:key)

**Implementierungen:**
- `WebCryptoAdapter` (noble/ed25519 + Web Crypto API)

### Neu (v2, Interface-Phase)

#### MessagingAdapter

Verantwortlich für:
- Cross-User Delivery zwischen DIDs
- Attestation/Verification Zustellung (Empfänger-Prinzip)
- Item-Key Delivery (selektive Sichtbarkeit)
- DID-Auflösung (wie findet man den Empfänger?)

**Geplante Implementierungen:**
- Custom WebSocket Relay (POC)
- Matrix Client (Produktion)

#### ReplicationAdapter

Verantwortlich für:
- Multi-Device Sync (Personal Space)
- Multi-User Sync (Shared Spaces: Kanban, Kalender, Karte)
- Membership Management (wer ist in welchem Space?)

**Geplante Implementierungen:**
- Evolu (Personal Space, POC)
- Automerge (Shared Spaces, Produktion)

#### AuthorizationAdapter

Verantwortlich für:
- UCAN-ähnliche Capabilities (signiert, delegierbar)
- Read/Write/Delete/Delegate Granularität
- Proof Chains (offline-verifizierbar)

**Geplante Implementierungen:**
- NoOp (POC: Creator = Admin)
- Custom UCAN-like (Produktion)

> Vollständige Interface-Spezifikationen: [Adapter-Architektur v2](../protokolle/adapter-architektur-v2.md)

## Referenz: wot-core

Die TypeScript-Definitionen aller Typen und Interfaces befinden sich im `packages/wot-core` Package:

```
packages/wot-core/src/
├── types/
│   ├── identity.ts      # Identity, Profile, KeyPair
│   ├── contact.ts       # Contact, ContactStatus
│   ├── verification.ts  # Verification, GeoLocation
│   ├── attestation.ts   # Attestation, AttestationMetadata
│   └── proof.ts         # Proof (W3C Data Integrity)
├── adapters/
│   └── interfaces/
│       ├── StorageAdapter.ts
│       ├── ReactiveStorageAdapter.ts
│       ├── Subscribable.ts
│       ├── CryptoAdapter.ts
│       └── SyncAdapter.ts          # → wird durch Messaging + Replication ersetzt
└── crypto/
    ├── did.ts           # did:key Implementierung
    ├── jws.ts           # JSON Web Signature
    └── encoding.ts      # Base58, Base64Url
```

## Framework-Evaluation

Für eine detaillierte Analyse aller evaluierten CRDT/E2EE/Messaging Frameworks siehe:
→ [Framework-Evaluation v2](../protokolle/framework-evaluation.md)

## Weiterführend

- [Adapter-Architektur v2](../protokolle/adapter-architektur-v2.md) - 6-Adapter-Spezifikation (NEU)
- [Entitäten](entitaeten.md) - Datenmodell im Detail
- [Sync-Protokoll](../protokolle/sync-protokoll.md) - Wie Daten synchronisiert werden
- [Verschlüsselung](../protokolle/verschluesselung.md) - E2E-Verschlüsselung
