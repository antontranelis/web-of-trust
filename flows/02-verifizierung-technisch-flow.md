# Verifizierungs-Flow (Technische Perspektive)

> Was die Geräte und das System tun

## Datenmodell

```mermaid
erDiagram
    USER {
        string did PK "Decentralized Identifier"
        string publicKey "Ed25519 Public Key"
        string privateKey "Lokal, nie geteilt"
        string name "Selbstgewählt"
        string photo "Optional"
        string bio "Optional"
    }
    
    CONTACT {
        string did PK "DID des Kontakts"
        string publicKey "Kontakts Public Key"
        string status "pending oder active oder hidden"
        datetime verifiedAt
        string verificationSig "Eigene Signatur"
    }
    
    AUTO_GROUP {
        string groupKey "Symmetrischer Schlüssel"
        datetime lastRotation
    }
    
    USER ||--o{ CONTACT : "hat"
    USER ||--|| AUTO_GROUP : "hat genau eine"
    AUTO_GROUP ||--o{ CONTACT : "enthält aktive"
```

## QR-Code Struktur

```mermaid
flowchart LR
    subgraph QR["QR-Code Inhalt"]
        DID["did:wot:a7f382b1..."]
        PK["publicKey: ed25519:..."]
    end
    
    subgraph Optional["Optional wenn klein genug"]
        NAME["name: Anna"]
        SIG["signature: ..."]
    end
    
    QR -.-> Optional
```

**Minimal (druckfreundlich):**
```json
{
  "did": "did:wot:a7f382b1c9d4e5f6",
  "pk": "ed25519:base64encodedkey..."
}
```

**Erweitert (digitaler QR):**
```json
{
  "did": "did:wot:a7f382b1c9d4e5f6",
  "pk": "ed25519:base64encodedkey...",
  "name": "Anna Müller",
  "sig": "signatur_des_payloads"
}
```

## Hauptflow: Gegenseitige Verifizierung

```mermaid
sequenceDiagram
    participant A_UI as Anna UI
    participant A_App as Anna App
    participant Sync as Sync Server
    participant B_App as Ben App
    participant B_UI as Ben UI

    Note over A_UI,B_UI: Phase 1 - Ben verifiziert Anna

    A_UI->>A_App: showQRCode()
    A_App->>A_App: generateQR(did, publicKey)
    A_App->>A_UI: Display QR
    
    B_UI->>B_App: scanQR()
    B_App->>B_App: parseQR() gibt did, publicKey
    
    alt Online
        B_App->>Sync: fetchProfile(did)
        Sync->>B_App: name, photo, bio, signature
        B_App->>B_App: verifySignature(profile, publicKey)
        B_App->>B_UI: Zeige Profil
    else Offline
        B_App->>B_App: computeIDHash(did)
        B_App->>B_UI: Zeige ID-Pruefwert
    end
    
    B_UI->>B_App: confirmIdentity()
    
    B_App->>B_App: createVerification(anna.did)
    Note over B_App: Verification Dokument erstellt
    B_App->>B_App: saveContact(anna, pending)
    
    Note over A_UI,B_UI: Phase 2 - Anna verifiziert Ben

    B_UI->>B_App: showQRCode()
    B_App->>B_UI: Display QR
    
    A_UI->>A_App: scanQR()
    A_App->>A_App: parseQR() gibt did, publicKey
    A_App->>A_UI: Zeige Profil plus X Kontakte kennen Ben
    
    A_UI->>A_App: confirmIdentity()
    A_App->>A_App: createVerification(ben.did)
    A_App->>A_App: saveContact(ben, active)
    A_App->>A_App: addToAutoGroup(ben)
    A_App->>A_App: reencryptItemsForNewContact(ben)
    
    Note over A_UI,B_UI: Phase 3 - Sync und Finalisierung

    A_App->>Sync: pushVerification()
    A_App->>Sync: pushReencryptedItemKeys()
    Sync->>B_App: pullUpdates()
    B_App->>B_App: updateContact(anna, active)
    B_App->>B_App: addToAutoGroup(anna)
    B_App->>B_App: reencryptItemsForNewContact(anna)
    B_App->>Sync: pushReencryptedItemKeys()
```

## Detailflow: Verifizierung erstellen

```mermaid
flowchart TD
    Start(["Nutzer tippt Identitaet bestaetigen"]) --> CreateVerif["createVerification()"]
    
    CreateVerif --> BuildPayload["Baue Payload: type, from, to, timestamp"]
    
    BuildPayload --> Sign["Signiere mit privateKey"]
    
    Sign --> Store["Speichere lokal: Contact + Verification"]
    
    Store --> CheckMutual{"Gegenseitige Verifizierung vorhanden?"}
    
    CheckMutual -->|Ja| Activate["Status = active"]
    Activate --> AddGroup["Zu Auto-Gruppe hinzufuegen"]
    AddGroup --> Reencrypt["Item Keys neu verschluesseln"]
    Reencrypt --> Queue["In Sync-Queue"]
    
    CheckMutual -->|Nein| Pending["Status = pending"]
    Pending --> Queue
    
    Queue --> End(["Fertig"])
```

**Voraussetzung:** Nutzer hat bereits eine ID (siehe Flow 01: Onboarding).

## Detailflow: Item Keys neu verschlüsseln

```mermaid
flowchart TD
    Start(["Neuer Kontakt in Auto-Gruppe"]) --> Fetch["Lade alle Items mit target: allContacts"]
    
    Fetch --> Loop{"Fuer jedes Item"}
    
    Loop --> Decrypt["Entschluessele Item Key mit eigenem Private Key"]
    Decrypt --> Encrypt["Verschluessele Item Key mit Contact Public Key"]
    Encrypt --> Store["Speichere verschluesselten Item Key"]
    Store --> Loop
    
    Loop -->|Alle fertig| Queue["Alle neuen Item Keys in Sync-Queue"]
    Queue --> End(["Fertig"])
```

## Detailflow: Offline-Verifizierung

```mermaid
sequenceDiagram
    participant A as Anna Geraet
    participant B as Ben Geraet
    
    Note over A,B: Kein Internet verfuegbar
    
    A->>A: generateQR(did, publicKey)
    A->>B: QR-Scan physisch
    
    B->>B: parseQR()
    B->>B: computeIDHash(did)
    B->>B: display a7f3-82b1-...
    
    Note over A,B: Muendlicher Abgleich
    A->>A: display own ID hash
    A->>B: Bei mir steht a7f3-82b1
    B->>B: verify match
    
    B->>B: createVerification(anna.did)
    B->>B: saveContact(anna, pending)
    Note over B: Lokal gespeichert wartet auf Sync
    
    Note over A,B: Rollen tauschen
    
    B->>B: generateQR(did, publicKey)
    B->>A: QR-Scan physisch
    A->>A: parseQR()
    A->>A: computeIDHash(did)
    
    Note over A,B: Muendlicher Abgleich
    A->>A: verify match
    
    A->>A: createVerification(ben.did)
    A->>A: saveContact(ben, active)
    A->>A: addToAutoGroup(ben)
    A->>A: reencryptItemsForNewContact(ben)
    Note over A: Alles lokal wartet auf Sync
    
    Note over A,B: Spaeter beide online
    
    A->>A: syncPush()
    B->>B: syncPush()
    B->>B: syncPull()
    B->>B: updateContact(anna, active)
    B->>B: addToAutoGroup(anna)
```

## Zustandsdiagramm: Kontakt-Status

```mermaid
stateDiagram-v2
    [*] --> Pending: Einseitig verifiziert
    
    Pending --> Active: Gegenseite verifiziert zurueck
    Pending --> [*]: Timeout oder Abbruch
    
    Active --> Hidden: Nutzer blendet aus
    
    Hidden --> Active: Nutzer macht rueckgaengig
    
    state Active {
        [*] --> InAutoGroup
        InAutoGroup: In Auto-Gruppe
    }
    
    state Hidden {
        [*] --> OutOfAutoGroup
        OutOfAutoGroup: Aus Auto-Gruppe entfernt
    }
    
    state Pending {
        [*] --> WaitingForMutual
        WaitingForMutual: Wartet auf Gegenseite
    }
```

### Kontakt-Status Details

| Status | In Auto-Gruppe | Sieht Content | Erhaelt Item Keys |
|--------|----------------|---------------|-------------------|
| Pending | Nein | Nein | Nein |
| Active | Ja | Ja (neuen) | Ja |
| Hidden | Nein | Nein (neuen) | Nein, alte noch lesbar |

## Datenstrukturen

### Verification Document

```json
{
  "@context": "https://w3id.org/weboftrust/v1",
  "type": "IdentityVerification",
  "id": "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
  "from": "did:wot:anna123",
  "to": "did:wot:ben456",
  "timestamp": "2025-01-08T14:30:00Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:wot:anna123#key-1",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndTEcnUn..."
  }
}
```

### Contact Record (lokal)

```json
{
  "did": "did:wot:ben456",
  "publicKey": "ed25519:base64...",
  "name": "Ben Schmidt",
  "status": "active",
  "verifiedAt": "2025-01-08T14:30:00Z",
  "myVerification": "urn:uuid:123e4567-...",
  "theirVerification": "urn:uuid:789abcde-..."
}
```

### Auto-Group (lokal)

```json
{
  "id": "urn:uuid:autogroup-anna",
  "type": "AutoContactGroup",
  "groupKey": "aes256:encrypted_with_own_pubkey...",
  "members": [
    "did:wot:ben456",
    "did:wot:carla789"
  ],
  "lastKeyRotation": "2025-01-08T14:30:00Z"
}
```
