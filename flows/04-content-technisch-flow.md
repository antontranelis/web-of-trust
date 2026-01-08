# Content-Flow (Technische Perspektive)

> Wie Content erstellt, verschlüsselt und verteilt wird

## Datenmodell

```mermaid
erDiagram
    USER {
        string did PK
        string publicKey
        string name
    }

    ITEM {
        string id PK "UUID"
        string type "calendar, map, project, offer, request"
        string ownerDid FK
        string title
        string content "JSON, verschlüsselt"
        string visibility "contacts, groups, selective"
        array groupDids "bei visibility=groups"
        datetime createdAt
        datetime updatedAt
        boolean deleted
    }

    ITEM_KEY {
        string itemId FK
        string recipientDid FK
        string encryptedKey "Mit recipient PK verschlüsselt"
    }

    GROUP {
        string did PK
        string name
        string groupKey "Symmetrisch"
    }

    USER ||--o{ ITEM : "erstellt"
    ITEM ||--o{ ITEM_KEY : "hat"
    USER ||--o{ ITEM_KEY : "empfängt"
    ITEM }o--o{ GROUP : "gehört zu"
```

## Item-Dokument Struktur

### Kalender-Eintrag

```json
{
  "@context": "https://w3id.org/weboftrust/v1",
  "type": "CalendarItem",
  "id": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "owner": "did:key:anna123",
  "title": "Gartentreffen",
  "content": {
    "startDate": "2025-01-15T14:00:00Z",
    "endDate": "2025-01-15T17:00:00Z",
    "location": {
      "name": "Gemeinschaftsgarten Sonnenberg",
      "coordinates": [51.0504, 13.7373]
    },
    "description": "Wir bereiten die Beete für das Frühjahr vor."
  },
  "visibility": {
    "type": "contacts"
  },
  "createdAt": "2025-01-08T10:00:00Z",
  "updatedAt": "2025-01-08T10:00:00Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:key:anna123#key-1",
    "proofValue": "z58DAdFfa9..."
  }
}
```

### Karten-Markierung

```json
{
  "@context": "https://w3id.org/weboftrust/v1",
  "type": "MapItem",
  "id": "urn:uuid:660e8400-e29b-41d4-a716-446655440001",
  "owner": "did:key:anna123",
  "title": "Werkzeugverleih",
  "content": {
    "coordinates": [51.0504, 13.7373],
    "category": "lending",
    "description": "Hier kann man sich Werkzeug ausleihen."
  },
  "visibility": {
    "type": "contacts"
  },
  "createdAt": "2025-01-08T10:00:00Z",
  "proof": { ... }
}
```

### Angebot / Gesuch

```json
{
  "@context": "https://w3id.org/weboftrust/v1",
  "type": "OfferItem",
  "id": "urn:uuid:770e8400-e29b-41d4-a716-446655440002",
  "owner": "did:key:ben456",
  "title": "Kann bei Umzug helfen",
  "content": {
    "category": "help",
    "description": "Habe ein Auto und kann schwere Sachen transportieren.",
    "availability": "Wochenenden"
  },
  "visibility": {
    "type": "contacts"
  },
  "createdAt": "2025-01-08T10:00:00Z",
  "proof": { ... }
}
```

---

## Hauptflow: Content erstellen

```mermaid
flowchart TD
    Start(["Nutzer erstellt Content"]) --> Input["Eingabe: Typ, Titel, Inhalt"]

    Input --> Validate{"Eingaben valide?"}

    Validate -->|Nein| Error["Fehler anzeigen"]
    Error --> Input

    Validate -->|Ja| BuildDoc["Baue Item-Dokument"]

    BuildDoc --> Sign["Signiere mit Private Key"]

    Sign --> GenItemKey["Generiere Item Key AES-256"]

    GenItemKey --> EncryptContent["Verschlüssele Content mit Item Key"]

    EncryptContent --> Visibility{"Sichtbarkeit?"}

    Visibility -->|Alle Kontakte| EncryptAll["Verschlüssele Item Key für jeden aktiven Kontakt"]
    Visibility -->|Ausgewählte| EncryptSelected["Verschlüssele Item Key für ausgewählte"]
    Visibility -->|Gruppen| EncryptGroups["Verschlüssele Item Key mit Group Key(s)"]

    EncryptAll --> Store["Speichere lokal"]
    EncryptSelected --> Store
    EncryptGroups --> Store

    Store --> Queue["In Sync-Queue"]

    Queue --> Done(["Fertig"])
```

---

## Sequenzdiagramm: Content erstellen und verteilen

```mermaid
sequenceDiagram
    participant A_UI as Anna UI
    participant A_App as Anna App
    participant A_Store as Anna Local Store
    participant Sync as Sync Server
    participant B_App as Ben App

    A_UI->>A_App: createContent(type, data, visibility)

    A_App->>A_App: validateInput()
    A_App->>A_App: buildItemDoc()
    A_App->>A_App: signItem(privateKey)

    A_App->>A_App: generateItemKey() AES-256
    A_App->>A_App: encryptContent(itemKey)

    alt Visibility: contacts
        A_App->>A_App: getActiveContacts()
        loop Für jeden Kontakt
            A_App->>A_App: encryptItemKey(contact.publicKey)
        end
    else Visibility: selective
        loop Für jeden ausgewählten
            A_App->>A_App: encryptItemKey(selected.publicKey)
        end
    else Visibility: groups
        loop Für jede ausgewählte Gruppe
            A_App->>A_App: encryptItemKey(group.groupKey)
        end
    end

    A_App->>A_Store: saveItem(encryptedItem, itemKeys)

    A_App->>Sync: pushItem(encryptedItem, itemKeys)

    A_App->>A_UI: showSuccess()

    Sync->>B_App: notifyNewItem()
    B_App->>Sync: pullItem()
    B_App->>B_App: findMyItemKey()
    B_App->>B_App: decryptItemKey(privateKey)
    B_App->>B_App: decryptContent(itemKey)
    B_App->>B_App: verifySignature(owner.publicKey)
    B_App->>B_App: storeItem()
```

---

## Verschlüsselungsschema

### Item Key Verteilung

```mermaid
flowchart LR
    subgraph Creation["Item Erstellung"]
        Item["Item Klartext"]
        ItemKey["Item Key generieren"]
    end

    subgraph Encryption["Verschlüsselung"]
        EncContent["Content verschlüsseln"]
        EncKey1["Key für Anna"]
        EncKey2["Key für Ben"]
        EncKey3["Key für Carla"]
    end

    subgraph Storage["Speicherung"]
        EncItem["Verschlüsseltes Item"]
        Keys["Item Key Tabelle"]
    end

    Item --> ItemKey
    ItemKey --> EncContent
    Item --> EncContent

    ItemKey --> EncKey1
    ItemKey --> EncKey2
    ItemKey --> EncKey3

    EncContent --> EncItem
    EncKey1 --> Keys
    EncKey2 --> Keys
    EncKey3 --> Keys
```

### Datenstruktur

```json
{
  "encryptedItem": {
    "id": "urn:uuid:550e8400...",
    "owner": "did:key:anna123",
    "ciphertext": "base64...",
    "nonce": "base64...",
    "proof": { ... }
  },
  "itemKeys": [
    {
      "recipientDid": "did:key:anna123",
      "encryptedKey": "base64..."
    },
    {
      "recipientDid": "did:key:ben456",
      "encryptedKey": "base64..."
    }
  ]
}
```

---

## Detailflow: Content empfangen

```mermaid
flowchart TD
    Receive(["Item empfangen"]) --> FindKey{"Item Key für mich vorhanden?"}

    FindKey -->|Nein| Reject["Ignorieren - nicht für mich"]

    FindKey -->|Ja| DecryptKey["Entschlüssele Item Key mit Private Key"]

    DecryptKey --> DecryptContent["Entschlüssele Content mit Item Key"]

    DecryptContent --> VerifySig{"Signatur gültig?"}

    VerifySig -->|Nein| RejectInvalid["Ablehnen - ungültige Signatur"]

    VerifySig -->|Ja| CheckOwner{"Owner bekannt?"}

    CheckOwner -->|Nein| RejectUnknown["Ablehnen - unbekannter Owner"]

    CheckOwner -->|Ja| Store["Speichern und anzeigen"]
```

---

## Sichtbarkeits-Optionen

### Typ: contacts (Alle Kontakte)

```mermaid
flowchart TD
    All(["Sichtbarkeit: contacts"]) --> GetContacts["Lade alle aktiven Kontakte"]

    GetContacts --> Loop{"Für jeden Kontakt"}

    Loop --> Encrypt["Verschlüssele Item Key mit Contact Public Key"]

    Encrypt --> Next["Nächster Kontakt"]
    Next --> Loop

    Loop -->|Fertig| Store["Speichere alle verschlüsselten Keys"]
```

**Bei neuem Kontakt:** Wenn Anna später einen neuen Kontakt verifiziert, werden alle Items mit `visibility: contacts` automatisch für diesen Kontakt neu verschlüsselt.

### Typ: selective (Ausgewählte)

```mermaid
flowchart TD
    Selected(["Sichtbarkeit: selective"]) --> Choose["Nutzer wählt Personen"]

    Choose --> Loop{"Für jeden Ausgewählten"}

    Loop --> Encrypt["Verschlüssele Item Key"]

    Encrypt --> Next["Nächster"]
    Next --> Loop

    Loop -->|Fertig| Store["Speichere"]
```

**Bei neuem Kontakt:** Neue Kontakte sehen diesen Content NICHT automatisch.

### Typ: groups (Eine oder mehrere Gruppen)

```mermaid
flowchart TD
    Groups(["Sichtbarkeit: groups"]) --> Select["Nutzer wählt Gruppen"]

    Select --> Loop{"Für jede Gruppe"}

    Loop --> GetKey["Lade Group Key"]
    GetKey --> Encrypt["Verschlüssele Item Key mit Group Key"]

    Encrypt --> Next["Nächste Gruppe"]
    Next --> Loop

    Loop -->|Fertig| Store["Speichere alle verschlüsselten Keys"]
```

**Multi-Gruppen:** Ein Item kann für mehrere Gruppen gleichzeitig freigegeben werden. Jede Gruppe erhält einen eigenen verschlüsselten Item Key.

**Effizienz:** Pro Gruppe nur eine Verschlüsselung nötig, egal wie viele Gruppenmitglieder.

---

## Content aktualisieren

```mermaid
sequenceDiagram
    participant A as Anna App
    participant Store as Local Store
    participant Sync as Sync Server
    participant B as Ben App

    A->>A: loadItem(id)
    A->>A: decryptContent()
    A->>A: modifyContent()
    A->>A: incrementVersion()
    A->>A: updateTimestamp()
    A->>A: signItem(privateKey)
    A->>A: encryptContent(existingItemKey)

    A->>Store: updateItem()
    A->>Sync: pushUpdate()

    Sync->>B: notifyItemUpdate()
    B->>Sync: pullUpdate()
    B->>B: verifySignature()
    B->>B: checkVersion() - höher als lokal?
    B->>B: replaceItem()
```

### Versionierung

```json
{
  "id": "urn:uuid:550e8400...",
  "version": 3,
  "previousVersion": "hash-of-version-2",
  "updatedAt": "2025-01-08T15:00:00Z"
}
```

---

## Content löschen

```mermaid
flowchart TD
    Delete(["Löschen angefordert"]) --> MarkDeleted["Setze deleted: true"]

    MarkDeleted --> Sign["Signiere Lösch-Marker"]

    Sign --> Store["Speichere lokal"]

    Store --> Sync["Sync Lösch-Marker"]

    Sync --> Recipients["Empfänger erhalten Marker"]

    Recipients --> Hide["Content wird als gelöscht angezeigt"]
```

### Lösch-Marker

```json
{
  "type": "ItemDeletion",
  "itemId": "urn:uuid:550e8400...",
  "deletedAt": "2025-01-08T16:00:00Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:key:anna123#key-1",
    "proofValue": "z58DAdFfa9..."
  }
}
```

**Wichtig:** Der verschlüsselte Content wird nicht physisch gelöscht. Empfänger, die ihn bereits entschlüsselt haben, behalten eine lokale Kopie.

---

## Speicher-Schema

```sql
CREATE TABLE items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    owner_did TEXT NOT NULL,
    title TEXT,
    encrypted_content TEXT NOT NULL,
    nonce TEXT NOT NULL,
    visibility_type TEXT NOT NULL,
    visibility_target TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    signature TEXT NOT NULL,
    raw_json TEXT NOT NULL
);

CREATE TABLE item_keys (
    item_id TEXT,
    recipient_did TEXT,
    encrypted_key TEXT NOT NULL,
    PRIMARY KEY (item_id, recipient_did)
);

CREATE INDEX idx_items_owner ON items(owner_did);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_deleted ON items(deleted);
CREATE INDEX idx_item_keys_recipient ON item_keys(recipient_did);
```

---

## Abfragen

### Alle Items eines Typs

```javascript
const calendarItems = await db.items
  .where('type')
  .equals('CalendarItem')
  .and(item => !item.deleted)
  .toArray();
```

### Items für einen bestimmten Zeitraum

```javascript
const upcomingEvents = await db.items
  .where('type')
  .equals('CalendarItem')
  .filter(item => {
    const content = decryptContent(item);
    return new Date(content.startDate) > new Date();
  })
  .toArray();
```

### Items in der Nähe

```javascript
const nearbyItems = await db.items
  .where('type')
  .equals('MapItem')
  .filter(item => {
    const content = decryptContent(item);
    return calculateDistance(myLocation, content.coordinates) < 1000;
  })
  .toArray();
```

---

## Benachrichtigungen

### Benachrichtigungs-Typen

```json
{
  "type": "item_created",
  "itemId": "urn:uuid:550e8400...",
  "itemType": "CalendarItem",
  "ownerDid": "did:key:anna123",
  "ownerName": "Anna Müller",
  "title": "Gartentreffen",
  "createdAt": "2025-01-08T10:00:00Z"
}
```

```json
{
  "type": "item_updated",
  "itemId": "urn:uuid:550e8400...",
  "changes": ["title", "content.startDate"],
  "updatedAt": "2025-01-08T15:00:00Z"
}
```

```json
{
  "type": "item_deleted",
  "itemId": "urn:uuid:550e8400...",
  "deletedAt": "2025-01-08T16:00:00Z"
}
```

---

## Sicherheitsüberlegungen

### Validierung

| Prüfung | Beschreibung |
| ------- | ------------ |
| Signatur | Item muss vom angegebenen Owner signiert sein |
| Owner | Owner muss ein bekannter Kontakt sein |
| Version | Update-Version muss höher sein als lokale |
| Lösch-Berechtigung | Nur Owner kann löschen |

### Angriffsvektoren

| Angriff | Schutz |
| ------- | ------ |
| Gefälschtes Item | Signatur-Prüfung |
| Replay alter Version | Versions-Check |
| Unbefugtes Löschen | Nur signierte Lösch-Marker akzeptieren |
| Metadaten-Leak | Auch Metadaten sind verschlüsselt |
