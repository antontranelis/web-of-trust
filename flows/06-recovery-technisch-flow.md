# Recovery-Flow (Technische Perspektive)

> Wie eine Identität aus der Recovery-Phrase wiederhergestellt wird

## Übersicht

```mermaid
flowchart TD
    Input(["12 Wörter eingeben"]) --> Validate["BIP39 validieren"]

    Validate --> Derive["Seed ableiten PBKDF2"]

    Derive --> Generate["KeyPair generieren Ed25519"]

    Generate --> ComputeDID["DID berechnen"]

    ComputeDID --> Fetch["Daten vom Server abrufen"]

    Fetch --> Decrypt["Mit Private Key entschlüsseln"]

    Decrypt --> Store["Lokal speichern"]

    Store --> Done(["Wiederhergestellt"])
```

---

## Hauptflow: Recovery

```mermaid
sequenceDiagram
    participant User as Nutzer
    participant App as App
    participant Crypto as Crypto-Modul
    participant Server as Sync Server
    participant Store as Local Store

    User->>App: Gibt 12 Wörter ein

    App->>Crypto: validateMnemonic(words)
    Crypto->>Crypto: Prüfe gegen BIP39-Wortliste
    Crypto->>Crypto: Prüfe Checksum

    alt Ungültig
        Crypto->>App: invalid
        App->>User: Fehler: Ungültige Phrase
    else Gültig
        Crypto->>App: valid
    end

    App->>Crypto: deriveSeed(mnemonic)
    Crypto->>Crypto: PBKDF2 mit 2048 Runden

    App->>Crypto: generateKeyPair(seed)
    Crypto->>Crypto: Ed25519 von Seed

    App->>Crypto: computeDID(publicKey)
    Crypto->>App: did:wot:...

    App->>Server: fetchDataForDID(did, signature)
    Server->>Server: Verifiziere Signatur mit Public Key aus DID
    Server->>App: Verschlüsselte Blobs

    loop Für jeden Blob
        App->>Crypto: decrypt(blob, privateKey)
        Crypto->>App: Klartext
        App->>Store: save(data)
    end

    App->>Store: storePrivateKey(secureStorage)

    App->>User: Wiederherstellung abgeschlossen
```

---

## Schritt 1: Mnemonic validieren

### BIP39-Validierung

```javascript
function validateMnemonic(words) {
  // 1. Prüfe Anzahl
  if (words.length !== 12) {
    return { valid: false, error: 'Genau 12 Wörter erforderlich' };
  }

  // 2. Prüfe ob alle Wörter in BIP39-Liste
  const wordlist = getBIP39Wordlist('english');
  for (const word of words) {
    if (!wordlist.includes(word.toLowerCase())) {
      return { valid: false, error: `Unbekanntes Wort: ${word}` };
    }
  }

  // 3. Prüfe Checksum
  const entropy = mnemonicToEntropy(words);
  const checksumBits = calculateChecksum(entropy);
  const expectedChecksum = extractChecksumFromMnemonic(words);

  if (checksumBits !== expectedChecksum) {
    return { valid: false, error: 'Checksum ungültig' };
  }

  return { valid: true };
}
```

### Checksum-Berechnung

```mermaid
flowchart LR
    Words["12 Wörter"] --> Indices["11-bit Indices"]
    Indices --> Concat["132 bits total"]
    Concat --> Split["128 bits Entropy + 4 bits Checksum"]
    Split --> Hash["SHA256(Entropy)"]
    Hash --> Compare["Erste 4 bits = Checksum?"]
```

---

## Schritt 2: Schlüssel ableiten

### Von Mnemonic zu KeyPair

```mermaid
flowchart TD
    Mnemonic["12 Wörter"] --> PBKDF2["PBKDF2-SHA512"]

    subgraph PBKDF2_Details["PBKDF2 Parameter"]
        Password["Password: Mnemonic als String"]
        Salt["Salt: 'mnemonic' + Passphrase"]
        Iterations["2048 Iterations"]
        KeyLen["512 bits Output"]
    end

    PBKDF2 --> Seed["512-bit Seed"]

    Seed --> Ed25519["Ed25519 Derivation"]

    Ed25519 --> PrivKey["Private Key 32 bytes"]
    Ed25519 --> PubKey["Public Key 32 bytes"]

    PubKey --> DID["DID berechnen"]
```

### Code-Beispiel

```javascript
async function recoverKeyPair(mnemonic) {
  // 1. Mnemonic zu Seed
  const mnemonicString = mnemonic.join(' ');
  const salt = 'mnemonic'; // Keine zusätzliche Passphrase

  const seed = await pbkdf2(
    mnemonicString,
    salt,
    2048,           // Iterations
    64,             // Key length in bytes (512 bits)
    'sha512'
  );

  // 2. Seed zu Ed25519 KeyPair
  const privateKey = seed.slice(0, 32);
  const publicKey = ed25519.getPublicKey(privateKey);

  // 3. DID berechnen
  const publicKeyHash = sha256(publicKey);
  const didSuffix = base58.encode(publicKeyHash.slice(0, 16));
  const did = `did:wot:${didSuffix}`;

  return { privateKey, publicKey, did };
}
```

---

## Schritt 3: Daten abrufen

### Authentifizierung bei Recovery

```mermaid
sequenceDiagram
    participant App as App
    participant Server as Server

    App->>App: Generiere Schlüssel aus Phrase
    App->>App: Berechne DID

    Note over App: Challenge-Response

    App->>App: timestamp = now()
    App->>App: nonce = random()
    App->>App: message = did + timestamp + nonce
    App->>App: signature = sign(message, privateKey)

    App->>Server: POST /recovery/init
    Note over App,Server: did, timestamp, nonce, signature

    Server->>Server: Extrahiere Public Key aus DID
    Server->>Server: Verifiziere Signatur
    Server->>Server: Prüfe Timestamp nicht zu alt

    Server->>App: recoveryToken + dataManifest
```

### Daten-Manifest

```json
{
  "did": "did:wot:anna123",
  "dataAvailable": {
    "profile": true,
    "contacts": 23,
    "verifications": 23,
    "attestationsReceived": 47,
    "attestationsGiven": 12,
    "items": 34,
    "groups": 3
  },
  "totalSize": "2.3 MB",
  "lastSync": "2025-01-08T10:00:00Z"
}
```

### Daten herunterladen

```mermaid
flowchart TD
    Manifest(["Manifest empfangen"]) --> Download["Starte Download"]

    Download --> Profile["Profil laden"]
    Profile --> Contacts["Kontakte laden"]
    Contacts --> Verifications["Verifizierungen laden"]
    Verifications --> Attestations["Attestationen laden"]
    Attestations --> Items["Items laden"]
    Items --> Groups["Gruppen laden"]

    Groups --> Decrypt["Alles entschlüsseln"]

    Decrypt --> Store["In lokale DB speichern"]
```

---

## Schritt 4: Daten entschlüsseln

### Entschlüsselungs-Flow

```mermaid
flowchart TD
    Blob["Verschlüsselter Blob"] --> FindKey["Finde meinen Item Key"]

    FindKey --> DecryptKey["Entschlüssele Item Key mit Private Key"]

    DecryptKey --> DecryptContent["Entschlüssele Content mit Item Key"]

    DecryptContent --> Verify["Verifiziere Signatur"]

    Verify --> Store["Speichern"]
```

### Code-Beispiel

```javascript
async function decryptBlob(blob, privateKey) {
  // 1. Finde meinen verschlüsselten Item Key
  const myDid = computeDID(getPublicKey(privateKey));
  const myItemKey = blob.itemKeys.find(k => k.recipientDid === myDid);

  if (!myItemKey) {
    throw new Error('Kein Schlüssel für mich gefunden');
  }

  // 2. Entschlüssele Item Key
  const itemKey = await decryptAsymmetric(
    myItemKey.encryptedKey,
    privateKey
  );

  // 3. Entschlüssele Content
  const content = await decryptSymmetric(
    blob.encryptedContent,
    itemKey,
    blob.nonce
  );

  // 4. Verifiziere Signatur
  const ownerPublicKey = await getPublicKeyForDID(blob.owner);
  const isValid = await verifySignature(content, blob.proof, ownerPublicKey);

  if (!isValid) {
    throw new Error('Ungültige Signatur');
  }

  return JSON.parse(content);
}
```

---

## Schritt 5: Private Key speichern

### Plattform-spezifische Speicherung

```mermaid
flowchart TD
    PrivKey["Private Key"] --> Platform{"Platform?"}

    Platform -->|iOS| Keychain["iOS Keychain"]
    Platform -->|Android| Keystore["Android Keystore"]
    Platform -->|Web| WebCrypto["Web Crypto API"]

    Keychain --> Options1["kSecAttrAccessible: whenUnlockedThisDeviceOnly"]
    Keystore --> Options2["setUserAuthenticationRequired: true"]
    WebCrypto --> Options3["extractable: false"]
```

### Web: Besonderheit bei Recovery

Bei Web/Browser muss der Key aus der Mnemonic abgeleitet werden, da `extractable: false` Keys nicht importiert werden können:

```javascript
// Web: Key aus Seed generieren (nicht importieren)
async function storeKeyWeb(seed) {
  // Generiere non-extractable Key direkt aus Seed
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "Ed25519",
      // Seed als Entropy-Quelle (vereinfacht)
    },
    false,  // extractable = false
    ["sign", "verify"]
  );

  // In IndexedDB speichern
  const db = await openDB('wot-keys', 1);
  await db.put('keys', keyPair.privateKey, 'privateKey');
  await db.put('keys', keyPair.publicKey, 'publicKey');
}
```

**Hinweis:** Die genaue Implementierung hängt von der Web Crypto API Unterstützung ab. Möglicherweise muss ein anderer Algorithmus verwendet werden.

---

## Fehlerbehandlung

### Fehlertypen

```mermaid
flowchart TD
    Recovery(["Recovery starten"]) --> V1{"Mnemonic gültig?"}

    V1 -->|Nein| E1["Fehler: Ungültige Phrase"]

    V1 -->|Ja| V2{"Server erreichbar?"}

    V2 -->|Nein| E2["Fehler: Keine Verbindung"]

    V2 -->|Ja| V3{"DID auf Server bekannt?"}

    V3 -->|Nein| E3["Fehler: Keine Daten gefunden"]

    V3 -->|Ja| V4{"Entschlüsselung erfolgreich?"}

    V4 -->|Nein| E4["Fehler: Daten korrupt"]

    V4 -->|Ja| Success["Recovery erfolgreich"]
```

### Fehler-Responses

```json
{
  "error": "invalid_mnemonic",
  "message": "Die Recovery-Phrase ist ungültig",
  "details": {
    "invalidWord": "applz",
    "position": 1,
    "suggestion": "apple"
  }
}
```

```json
{
  "error": "did_not_found",
  "message": "Für diese Identität existieren keine Daten",
  "details": {
    "did": "did:wot:xyz123",
    "hint": "Wurde die Identität auf einem anderen Server erstellt?"
  }
}
```

---

## Sicherheitsüberlegungen

### Brute-Force-Schutz

| Maßnahme | Beschreibung |
| -------- | ------------ |
| BIP39 Entropy | 128 bits = 2^128 Kombinationen |
| Rate Limiting | Max 5 Recovery-Versuche pro IP pro Stunde |
| Keine Enumeration | Server verrät nicht ob DID existiert ohne gültige Signatur |

### Timing-Analyse

```javascript
// Constant-time Vergleich für Signatur-Prüfung
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}
```

### Recovery vs. Neuanmeldung

Der Server kann nicht unterscheiden zwischen:
- Legitimem Nutzer der recovered
- Angreifer der die Phrase gestohlen hat

**Konsequenz:** Die Phrase IST die Identität. Wer die Phrase hat, hat die Kontrolle.

---

## Speicher-Schema

### Recovery-spezifische Tabellen

```sql
-- Tracking für Recovery-Prozess
CREATE TABLE recovery_state (
    id INTEGER PRIMARY KEY,
    phase TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    total_items INTEGER,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    error TEXT
);

-- Download-Queue während Recovery
CREATE TABLE recovery_queue (
    id TEXT PRIMARY KEY,
    blob_type TEXT NOT NULL,
    blob_id TEXT NOT NULL,
    downloaded BOOLEAN DEFAULT FALSE,
    decrypted BOOLEAN DEFAULT FALSE,
    error TEXT
);
```

---

## Multi-Device vs. Recovery

### Unterschied

| Aspekt | Multi-Device | Recovery |
| ------ | ------------ | -------- |
| Phrase eingeben | Ja | Ja |
| Altes Gerät noch aktiv | Ja | Nein |
| Sync-State | Übernommen vom alten Gerät | Komplett neu vom Server |
| Private Key | Neu generiert aus Phrase | Neu generiert aus Phrase |

### Gleiche Phrase, mehrere Geräte

```mermaid
flowchart TD
    Phrase["Recovery-Phrase"] --> Phone["Handy"]
    Phrase --> Tablet["Tablet"]
    Phrase --> Web["Browser"]

    Phone --> Same["Gleicher Private Key"]
    Tablet --> Same
    Web --> Same

    Same --> SameDID["Gleiche DID"]

    SameDID --> Sync["Sync hält alle Geräte aktuell"]
```

---

## Sequenzdiagramm: Vollständiger Recovery-Flow

```mermaid
sequenceDiagram
    participant U as Nutzer
    participant App as App
    participant Crypto as Crypto
    participant Server as Server
    participant Secure as Secure Storage
    participant DB as Local DB

    U->>App: 12 Wörter eingeben

    App->>Crypto: validateMnemonic()
    Crypto->>App: valid

    App->>Crypto: deriveSeed()
    Crypto->>App: seed

    App->>Crypto: generateKeyPair(seed)
    Crypto->>App: privateKey, publicKey

    App->>Crypto: computeDID(publicKey)
    Crypto->>App: did

    App->>App: createAuthChallenge(did, privateKey)

    App->>Server: POST /recovery/init
    Server->>Server: verifySignature()
    Server->>App: recoveryToken, manifest

    App->>U: Zeige Fortschritt

    loop Für jeden Datentyp
        App->>Server: GET /recovery/data/:type
        Server->>App: encryptedBlobs[]

        loop Für jeden Blob
            App->>Crypto: decrypt(blob, privateKey)
            Crypto->>App: plaintext
            App->>DB: store(data)
        end

        App->>U: Fortschritt aktualisieren
    end

    App->>Secure: storePrivateKey()
    Secure->>App: ok

    App->>DB: markRecoveryComplete()

    App->>U: Willkommen zurück!
```
