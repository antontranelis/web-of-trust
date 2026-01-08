# Attestation-Flow (Technische Perspektive)

> Wie Attestationen erstellt, signiert und verteilt werden

## Datenmodell

```mermaid
erDiagram
    USER {
        string did PK
        string publicKey
        string name
    }
    
    ATTESTATION {
        string id PK "UUID"
        string fromDid FK "Ersteller"
        string toDid FK "Empfänger"
        string claim "Freitext"
        string contextGroupId FK "Optional"
        datetime createdAt
        string signature
    }
    
    TAG {
        string id PK
        string name
    }
    
    GROUP {
        string did PK
        string name
    }
    
    USER ||--o{ ATTESTATION : "erstellt"
    USER ||--o{ ATTESTATION : "empfängt"
    ATTESTATION }o--o{ TAG : "hat"
    ATTESTATION }o--o| GROUP : "im Kontext von"
```

## Attestation-Dokument Struktur

```json
{
  "@context": "https://w3id.org/weboftrust/v1",
  "type": "Attestation",
  "id": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "from": "did:wot:anna123",
  "to": "did:wot:ben456",
  "claim": "Hat 3 Stunden im Gemeinschaftsgarten geholfen",
  "tags": ["garten", "helfen"],
  "context": "did:wot:group:gemeinschaftsgarten",
  "createdAt": "2025-01-08T14:32:00Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:wot:anna123#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndTEcnUn..."
  }
}
```

## Hauptflow: Attestation erstellen

```mermaid
flowchart TD
    Start(["Nutzer tippt Attestation erstellen"]) --> CheckContact{"Kontakt verifiziert?"}
    
    CheckContact -->|Nein| Error["Fehler: Nur für verifizierte Kontakte"]
    CheckContact -->|Ja| ShowForm["Zeige Formular"]
    
    ShowForm --> Input["Nutzer gibt ein: Claim, Tags, Gruppe"]
    
    Input --> Validate{"Eingaben valide?"}
    
    Validate -->|Nein| ShowForm
    Validate -->|Ja| BuildDoc["Baue Attestation-Dokument"]
    
    BuildDoc --> Sign["Signiere mit Private Key"]
    
    Sign --> Store["Speichere lokal"]
    
    Store --> Encrypt["Verschluessele fuer Empfaenger und eigene Kontakte"]
    
    Encrypt --> Queue["In Sync-Queue"]
    
    Queue --> Notify["Erstelle Benachrichtigung fuer Empfaenger"]
    
    Notify --> Done(["Fertig"])
```

## Sequenzdiagramm: Attestation erstellen und verteilen

```mermaid
sequenceDiagram
    participant A_UI as Anna UI
    participant A_App as Anna App
    participant A_Store as Anna Local Store
    participant Sync as Sync Server
    participant B_App as Ben App
    participant B_UI as Ben UI

    A_UI->>A_App: openAttestationForm(ben.did)
    A_App->>A_App: checkContactStatus(ben.did)
    A_App->>A_UI: showForm()
    
    A_UI->>A_App: submitAttestation(claim, tags, group)
    
    A_App->>A_App: validateInput()
    A_App->>A_App: buildAttestationDoc()
    Note over A_App: id, from, to, claim, tags, context, createdAt
    
    A_App->>A_App: signAttestation(privateKey)
    Note over A_App: Fuegt proof-Objekt hinzu
    
    A_App->>A_Store: saveAttestation(doc)
    
    A_App->>A_App: encryptForRecipients()
    Note over A_App: Verschluesselt fuer Ben und alle eigenen Kontakte
    
    A_App->>Sync: pushAttestation(encryptedDoc)
    
    A_App->>A_UI: showSuccess()
    
    Sync->>B_App: notifyNewAttestation()
    B_App->>Sync: pullAttestation()
    B_App->>B_App: decryptAttestation()
    B_App->>B_App: verifySignature(anna.publicKey)
    B_App->>B_App: storeAttestation()
    B_App->>B_UI: showNotification()
```

## Detailflow: Signatur erstellen

```mermaid
flowchart TD
    Doc["Attestation-Dokument ohne proof"] --> Canonical["Kanonisiere JSON"]
    
    Canonical --> Hash["SHA-256 Hash"]
    
    Hash --> Sign["Ed25519 Sign mit Private Key"]
    
    Sign --> Encode["Base58 Encode"]
    
    Encode --> Proof["Erstelle proof-Objekt"]
    
    Proof --> Final["Fuege proof zu Dokument hinzu"]
```

### Kanonisierung

Bevor signiert wird, muss das JSON kanonisiert werden:

1. Keys alphabetisch sortieren
2. Keine Whitespace ausser in Strings
3. UTF-8 Encoding

```javascript
const canonical = JSON.stringify(doc, Object.keys(doc).sort());
const hash = sha256(canonical);
const signature = ed25519.sign(hash, privateKey);
const proofValue = base58.encode(signature);
```

## Detailflow: Signatur verifizieren

```mermaid
flowchart TD
    Receive["Empfange Attestation"] --> Extract["Extrahiere proof-Objekt"]
    
    Extract --> GetDoc["Dokument ohne proof"]
    
    GetDoc --> Canonical["Kanonisiere JSON"]
    
    Canonical --> Hash["SHA-256 Hash"]
    
    Hash --> Decode["Base58 Decode proofValue"]
    
    Decode --> GetKey["Hole Public Key von from-DID"]
    
    GetKey --> Verify{"Ed25519 Verify"}
    
    Verify -->|Gueltig| Accept["Attestation akzeptieren"]
    Verify -->|Ungueltig| Reject["Attestation ablehnen"]
```

## Verschluesselung und Verteilung

### Wer bekommt die Attestation?

```mermaid
flowchart TD
    A["Anna erstellt Attestation fuer Ben"] --> Encrypt["Verschluessele Attestation"]
    
    Encrypt --> E1["Mit Bens Public Key"]
    Encrypt --> E2["Mit eigenem Public Key"]
    Encrypt --> E3["Mit Public Keys aller eigenen Kontakte"]
    
    E1 --> Store["Speichere verschluesselte Versionen"]
    E2 --> Store
    E3 --> Store
    
    Store --> Sync["Sync zum Server"]
    
    Sync --> Pull1["Ben pullt seine Version"]
    Sync --> Pull2["Annas Kontakte pullen ihre Versionen"]
```

### Item-Key Verschluesselung

Attestationen nutzen das gleiche Verschluesselungsschema wie andere Items:

```mermaid
flowchart LR
    Attestation["Attestation Klartext"] --> SymKey["Generiere Item Key AES-256"]
    
    SymKey --> EncContent["Verschluessele Attestation mit Item Key"]
    
    SymKey --> EncKey1["Verschluessele Item Key mit Ben PK"]
    SymKey --> EncKey2["Verschluessele Item Key mit Anna PK"]
    SymKey --> EncKey3["Verschluessele Item Key mit Kontakt1 PK"]
    SymKey --> EncKeyN["..."]
    
    EncContent --> Store["Speichere"]
    EncKey1 --> Store
    EncKey2 --> Store
    EncKey3 --> Store
    EncKeyN --> Store
```

## Tags und Suche

### Tag-Verwaltung

```mermaid
flowchart TD
    Input["Nutzer gibt Tags ein"] --> Check{"Tag existiert?"}
    
    Check -->|Ja| Use["Verwende existierenden Tag"]
    Check -->|Nein| Create["Erstelle neuen Tag lokal"]
    
    Use --> Attach["Fuege Tag zu Attestation hinzu"]
    Create --> Attach
    
    Attach --> Index["Aktualisiere lokalen Such-Index"]
```

### Vordefinierte Tags

```json
{
  "predefinedTags": [
    {"id": "helfen", "emoji": "🤝", "label": "Helfen"},
    {"id": "garten", "emoji": "🌱", "label": "Garten"},
    {"id": "handwerk", "emoji": "🔧", "label": "Handwerk"},
    {"id": "transport", "emoji": "🚗", "label": "Transport"},
    {"id": "beratung", "emoji": "💬", "label": "Beratung"},
    {"id": "kochen", "emoji": "🍳", "label": "Kochen"},
    {"id": "kinderbetreuung", "emoji": "👶", "label": "Kinderbetreuung"},
    {"id": "technik", "emoji": "💻", "label": "Technik"}
  ]
}
```

## Gruppen-Kontext

### Attestation mit Gruppen-Kontext

```mermaid
sequenceDiagram
    participant A as Anna
    participant App as App
    participant G as Gruppe Gemeinschaftsgarten

    A->>App: Erstelle Attestation fuer Ben
    A->>App: Waehle Gruppe Gemeinschaftsgarten
    
    App->>App: Pruefe: Ist Anna Mitglied der Gruppe?
    App->>App: Pruefe: Ist Ben Mitglied der Gruppe?
    
    alt Beide Mitglieder
        App->>App: Fuege context-Feld hinzu
        Note over App: context: did:wot:group:gemeinschaftsgarten
    else Nicht beide Mitglieder
        App->>A: Warnung: Gruppen-Kontext nicht moeglich
    end
```

### Gruppen-Kontext Bedeutung

| Mit Kontext | Ohne Kontext |
|-------------|--------------|
| Attestation ist im Rahmen der Gruppe entstanden | Allgemeine Attestation |
| Sichtbar fuer alle Gruppen-Mitglieder | Nur fuer direkte Kontakte |
| Kann in Gruppen-Statistiken auftauchen | Nur in persoenlichem Profil |

## Benachrichtigungen

### Benachrichtigung fuer Empfaenger

```json
{
  "type": "attestation_received",
  "from": "did:wot:anna123",
  "fromName": "Anna Mueller",
  "attestationId": "urn:uuid:550e8400...",
  "preview": "Hat 3 Stunden im Gemeinschaftsgarten geholfen",
  "createdAt": "2025-01-08T14:32:00Z"
}
```

### Benachrichtigungs-Flow

```mermaid
flowchart TD
    Create["Attestation erstellt"] --> Notify["Erstelle Notification-Objekt"]
    
    Notify --> Encrypt["Verschluessele nur fuer Empfaenger"]
    
    Encrypt --> Push["Push zum Server"]
    
    Push --> Server["Server speichert"]
    
    Server --> Pull["Empfaenger App pullt"]
    
    Pull --> Decrypt["Entschluesseln"]
    
    Decrypt --> Show["Zeige Benachrichtigung"]
```

## Validierung

### Eingabe-Validierung

| Feld | Validierung |
|------|-------------|
| claim | Min 5 Zeichen, Max 500 Zeichen |
| tags | Min 0, Max 5 Tags |
| context | Muss existierende Gruppe sein oder leer |

### Signatur-Validierung beim Empfang

```mermaid
flowchart TD
    Receive["Attestation empfangen"] --> V1{"from-DID bekannt?"}
    
    V1 -->|Nein| Reject1["Ablehnen: Unbekannter Ersteller"]
    V1 -->|Ja| V2{"to-DID ist eigene DID oder Kontakt?"}
    
    V2 -->|Nein| Reject2["Ablehnen: Nicht relevant"]
    V2 -->|Ja| V3{"Signatur gueltig?"}
    
    V3 -->|Nein| Reject3["Ablehnen: Ungueltige Signatur"]
    V3 -->|Ja| V4{"Timestamp plausibel?"}
    
    V4 -->|Nein| Reject4["Ablehnen: Timestamp in Zukunft oder zu alt"]
    V4 -->|Ja| Accept["Akzeptieren und speichern"]
```

## Speicher-Schema

### Lokale Datenbank

```sql
CREATE TABLE attestations (
    id TEXT PRIMARY KEY,
    from_did TEXT NOT NULL,
    to_did TEXT NOT NULL,
    claim TEXT NOT NULL,
    context_group_id TEXT,
    created_at DATETIME NOT NULL,
    signature TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attestation_tags (
    attestation_id TEXT,
    tag_id TEXT,
    PRIMARY KEY (attestation_id, tag_id)
);

CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    is_predefined BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_attestations_to ON attestations(to_did);
CREATE INDEX idx_attestations_from ON attestations(from_did);
CREATE INDEX idx_attestations_context ON attestations(context_group_id);
```

## Abfragen

### Attestationen fuer eine Person

```javascript
// Alle Attestationen die Ben empfangen hat
const attestations = await db.attestations
  .where('to_did')
  .equals(ben.did)
  .toArray();
```

### Attestationen nach Tag filtern

```javascript
// Alle Attestationen mit Tag "garten"
const gartenAttestations = await db.attestation_tags
  .where('tag_id')
  .equals('garten')
  .toArray();
```

### Attestationen im Gruppen-Kontext

```javascript
// Alle Attestationen im Kontext der Gartengruppe
const groupAttestations = await db.attestations
  .where('context_group_id')
  .equals('did:wot:group:gemeinschaftsgarten')
  .toArray();
```

## Sicherheitsueberlegungen

### Spam-Schutz

| Massnahme | Beschreibung |
|-----------|--------------|
| Nur fuer Kontakte | Attestationen nur fuer verifizierte Kontakte |
| Rate Limiting | Max 10 Attestationen pro Stunde (Client-seitig) |
| Soziale Kontrolle | Wer spammt verliert Glaubwuerdigkeit |

### Manipulation

| Angriff | Schutz |
|---------|--------|
| Attestation faelschen | Signatur mit Private Key des Erstellers |
| Attestation aendern | Jede Aenderung invalidiert Signatur |
| Attestation loeschen | Empfaenger hat eigene Kopie |
| Falsche Behauptung | Nur soziale Konsequenzen moeglich |

### Unveraenderlichkeit

Attestationen sind bewusst **unveraenderlich**:

1. **Signatur:** Jede Aenderung wuerde die Signatur brechen
2. **Verteilt:** Mehrere Kopien existieren bei verschiedenen Nutzern
3. **Design:** Eine Aussage ueber die Vergangenheit kann nicht ungeschehen gemacht werden

Bei Fehlern: Neue korrigierende Attestation erstellen.
