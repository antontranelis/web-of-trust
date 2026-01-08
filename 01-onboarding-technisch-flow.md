# Onboarding-Flow (Technische Perspektive)

> Wie eine neue Identität erstellt und ins Netzwerk integriert wird

## Detailflow: ID-Erstellung

```mermaid
flowchart TD
    Start(["Nutzer tippt ID erstellen"]) --> Entropy["Sammle Entropie CSPRNG"]
    
    Entropy --> GenMnemonic["Generiere BIP39 Mnemonic 12 Wörter"]
    
    GenMnemonic --> DeriveSeed["Derive Seed von Mnemonic PBKDF2"]
    
    DeriveSeed --> GenKeyPair["Generiere Ed25519 KeyPair von Seed"]
    
    GenKeyPair --> CreateDID["Erstelle DID did:wot:hash"]
    
    CreateDID --> StorePrivate["Speichere Private Key in Secure Storage"]
    
    StorePrivate --> BlockNav["Blockiere Navigation"]
    
    BlockNav --> ShowMnemonic["Zeige Mnemonic EINMALIG"]
    
    ShowMnemonic --> StartQuiz["Starte Quiz: 3 zufällige Wort-Positionen"]
    
    StartQuiz --> Question{"Frage N von 3"}
    
    Question -->|Richtig| NextQ{"Alle 3 richtig?"}
    NextQ -->|Nein| Question
    NextQ -->|Ja| MarkSecured["Markiere als gesichert"]
    
    Question -->|Falsch| ShowError["Zeige Fehler und korrekte Antwort"]
    ShowError --> ShowMnemonic
    
    MarkSecured --> CreateProfile["Erstelle lokales Profil-Dokument"]
    
    CreateProfile --> SignProfile["Signiere Profil mit Private Key"]
    
    SignProfile --> Ready(["ID bereit"])
    
    style ShowMnemonic fill:#FFF3CD
    style BlockNav fill:#FFE4E4
```

## Sequenzdiagramm: Vollständiges Onboarding

```mermaid
sequenceDiagram
    participant A_App as Anna App
    participant QR as QR-Code
    participant B_Cam as Ben Kamera
    participant Store as App Store
    participant B_App as Ben App
    participant B_Secure as Ben Secure Storage
    participant Sync as Sync Server

    Note over A_App,Sync: Phase 1 Einladung

    A_App->>QR: generateInviteQR()
    Note over QR: App Store Link plus Anna DID und Public Key
    
    B_Cam->>QR: scan()
    B_Cam->>B_Cam: parseQR()
    
    alt App nicht installiert
        B_Cam->>Store: openAppStore(link)
        Store->>B_App: install()
        B_App->>B_App: launch mit deeplink
    else App installiert
        B_Cam->>B_App: openApp mit deeplink
    end

    Note over A_App,Sync: Phase 2 Annas Profil laden

    alt Online
        B_App->>Sync: fetchProfile(anna.did)
        Sync->>B_App: name photo bio sig
        B_App->>B_App: verifySignature(profile, anna.pk)
    else Offline
        B_App->>B_App: Zeige nur DID und Public Key Info
    end
    
    B_App->>B_App: displayInviter(anna)

    Note over A_App,Sync: Phase 3 ID erstellen

    B_App->>B_App: collectUserInput() name photo bio
    B_App->>B_App: generateEntropy(256bit)
    B_App->>B_App: createMnemonic(entropy) 12 words BIP39
    B_App->>B_App: deriveSeed(mnemonic) PBKDF2
    B_App->>B_App: generateKeyPair(seed) Ed25519
    B_App->>B_App: createDID(publicKey)
    
    B_App->>B_Secure: storePrivateKey(pk)
    B_Secure->>B_App: ok
    
    B_App->>B_App: displayMnemonic() EINMALIG
    B_App->>B_App: startQuiz() 3 zufaellige Positionen
    
    loop Quiz bis 3 richtige Antworten
        B_App->>B_App: showQuestion()
        alt Richtig
            B_App->>B_App: nextQuestion()
        else Falsch
            B_App->>B_App: showError()
            B_App->>B_App: displayMnemonic() erneut
            B_App->>B_App: startQuiz() neue Positionen
        end
    end
    
    B_App->>B_App: markBackupVerified()

    Note over A_App,Sync: Phase 4 Profil erstellen

    B_App->>B_App: createProfile()
    B_App->>B_App: signProfile(privateKey)
    B_App->>B_App: storeProfile(local)

    Note over A_App,Sync: Phase 5 Gegenseitige Verifizierung

    B_App->>B_App: createVerification(anna.did)
    B_App->>B_App: storeContact(anna, pending)
    
    B_App->>B_App: generateQR(ben.did, ben.pk)
    B_App->>A_App: physischer QR-Scan
    
    A_App->>A_App: parseQR() ben.did ben.pk
    A_App->>A_App: createVerification(ben.did)
    A_App->>A_App: storeContact(ben, active)
    A_App->>A_App: addToAutoGroup(ben)
    A_App->>A_App: reencryptItemsForNewContact(ben)

    Note over A_App,Sync: Phase 6 Sync

    A_App->>Sync: push verification profile itemKeys
    B_App->>Sync: push verification profile
    
    Sync->>B_App: pull anna verification
    B_App->>B_App: updateContact(anna, active)
    B_App->>B_App: addToAutoGroup(anna)
    
    Sync->>B_App: pull anna itemKeys for ben
    B_App->>B_App: Now can decrypt anna content
```

## Kryptographische Details

### Key Generation

```mermaid
flowchart LR
    subgraph Input
        CSPRNG["CSPRNG 256 bit entropy"]
    end
    
    subgraph BIP39["BIP39 Process"]
        Checksum["Add checksum 8 bits"]
        Split["Split into 11-bit chunks"]
        Words["Map to wordlist"]
    end
    
    subgraph KeyDerivation["Key Derivation"]
        PBKDF2["PBKDF2 2048 rounds"]
        Seed["512-bit seed"]
        Ed25519["Ed25519 derive"]
    end
    
    subgraph Output
        PrivKey["Private Key 32 bytes"]
        PubKey["Public Key 32 bytes"]
        DID["DID did:wot:..."]
    end
    
    CSPRNG --> Checksum --> Split --> Words
    Words -->|12 words| PBKDF2
    PBKDF2 --> Seed --> Ed25519
    Ed25519 --> PrivKey
    Ed25519 --> PubKey
    PubKey -->|hash and encode| DID
```

### DID Structure

```
did:wot:7Hy3kPqR9mNx2Wb5vLz8
     │   └──────────────────── Base58 encoded
     │                         first 16 bytes of
     │                         SHA256(publicKey)
     └────────────────────────── Method name
```

### Profil-Signatur

```json
{
  "@context": "https://w3id.org/weboftrust/v1",
  "type": "Profile",
  "id": "did:wot:7Hy3kPqR9mNx2Wb5vLz8",
  "name": "Ben Schmidt",
  "photo": "ipfs://Qm...",
  "bio": "Neu in der Gegend",
  "publicKey": {
    "type": "Ed25519VerificationKey2020",
    "publicKeyMultibase": "z6Mkf..."
  },
  "updated": "2025-01-08T14:30:00Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:wot:7Hy3kPqR9mNx2Wb5vLz8#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z58DAdFfa9..."
  }
}
```

## Invite-QR vs. Standard-QR

### Standard-QR (für bestehende Nutzer)

```json
{
  "type": "wot-identity",
  "did": "did:wot:anna123",
  "pk": "ed25519:base64..."
}
```

### Invite-QR (für Onboarding)

```json
{
  "type": "wot-invite",
  "app": "https://weboftrust.app/download",
  "did": "did:wot:anna123",
  "pk": "ed25519:base64...",
  "token": "optional-invite-token"
}
```

Das `token` könnte für Analytics oder spezielle Invite-Flows genutzt werden.

## Secure Storage

### Platform-spezifisch

| Platform | Storage | Details |
|----------|---------|---------|
| iOS | Keychain | kSecClassKey, Hardware-backed wenn verfügbar |
| Android | Keystore | AndroidKeyStore, TEE/Strongbox wenn verfügbar |
| Web | Web Crypto API + IndexedDB | extractable: false, Key nie als Raw exportierbar |

### Web Crypto API Details

```javascript
// Non-extractable Key generieren
const keyPair = await crypto.subtle.generateKey(
  { name: "Ed25519" },
  false,  // extractable = false
  ["sign", "verify"]
);

// In IndexedDB speichern (CryptoKey-Objekt direkt)
const db = await openDB('wot-keys', 1);
await db.put('keys', keyPair.privateKey, 'privateKey');
await db.put('keys', keyPair.publicKey, 'publicKey');

// Key kann nur für sign/verify verwendet werden
const signature = await crypto.subtle.sign(
  { name: "Ed25519" },
  keyPair.privateKey,
  data
);
```

### Web-spezifische Risiken

| Risiko | Mitigation |
|--------|------------|
| Browserdaten löschen löscht Keys | Recovery-Phrase ist EINZIGER Weg zurück |
| Kein Cross-Device Sync | Nutzer muss auf jedem Gerät recovern |
| Browser-Update könnte brechen | Unwahrscheinlich, aber Monitoring nötig |

**Konsequenz:** Recovery-Phrase-Sicherung ist im Web noch kritischer als bei nativen Apps!

### Was wird gespeichert

```mermaid
flowchart TD
    subgraph NeverStored["NIE gespeichert"]
        Mnemonic["Recovery-Phrase"]
    end
    
    subgraph LocalDB["Lokale Datenbank"]
        Profile["Eigenes Profil"]
        Contacts["Kontakte + Public Keys"]
        Items["Items + Item Keys"]
        Groups["Gruppen + Group Keys"]
    end
    
    subgraph SecureStorage["Secure Storage"]
        PrivKey["Private Key"]
    end
    
    style NeverStored fill:#FFE4E4,stroke:#FF0000
    style SecureStorage fill:#E4FFE4,stroke:#00AA00
```

**KRITISCH:** Die Recovery-Phrase wird nirgendwo gespeichert. Sie wird **exakt einmal** bei der ID-Erstellung angezeigt. Der Nutzer MUSS das Quiz bestehen um fortzufahren - es gibt keine ungesicherten Accounts.

## Fehlerbehandlung

### Onboarding-Abbruch

```mermaid
stateDiagram-v2
    [*] --> NotStarted
    
    NotStarted --> AppInstalled: App installieren
    AppInstalled --> ProfileEntered: Profil eingeben
    ProfileEntered --> KeysGenerated: Keys generieren
    KeysGenerated --> MnemonicShown: Mnemonic anzeigen
    MnemonicShown --> QuizPassed: Quiz bestehen
    QuizPassed --> VerificationDone: Verifizierung
    VerificationDone --> [*]: Fertig
    
    NotStarted --> [*]: Abbruch OK
    AppInstalled --> [*]: Abbruch OK
    ProfileEntered --> [*]: Abbruch OK
    
    KeysGenerated --> BLOCKED: Abbruch blockiert
    MnemonicShown --> BLOCKED: Abbruch blockiert
    
    state BLOCKED {
        [*] --> MustComplete
        MustComplete: Navigation blockiert bis Quiz bestanden
    }
    
    QuizPassed --> PartialSetup: Abbruch OK
    state PartialSetup {
        [*] --> HasID
        HasID: ID und Backup verifiziert - Keine Kontakte!
    }
```

### Quiz-Ablauf im Detail

```mermaid
flowchart TD
    ShowPhrase(["Zeige 12 Wörter"]) --> UserReady["Nutzer tippt Weiter"]
    
    UserReady --> Q1["Frage 1: Welches ist Wort X?"]
    Q1 -->|Richtig| Q2["Frage 2: Welches ist Wort Y?"]
    Q1 -->|Falsch| Error1["Fehler anzeigen"]
    Error1 --> ShowPhrase
    
    Q2 -->|Richtig| Q3["Frage 3: Welches ist Wort Z?"]
    Q2 -->|Falsch| Error2["Fehler anzeigen"]
    Error2 --> ShowPhrase
    
    Q3 -->|Richtig| Success(["Quiz bestanden - Weiter"])
    Q3 -->|Falsch| Error3["Fehler anzeigen"]
    Error3 --> ShowPhrase
```

**Wichtig:**
- X, Y, Z sind zufällige Positionen (1-12)
- Bei jedem Neustart werden neue Positionen gewählt
- Multiple-Choice mit 4 Optionen (1 richtig, 3 falsch aus der Wortliste)
- Kein Überspringen möglich

## Sicherheitsüberlegungen

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Mnemonic abfotografiert | Warnung Kein Screenshot plus OS-Screenshot-Schutz |
| Shoulder Surfing | Privater Raum empfohlen |
| Malware auf Gerät | Secure Storage / Web Crypto nutzt Hardware-Isolation |
| Server-Kompromittierung | Private Key verlässt nie das Gerät |
| QR-Code-Fälschung | Profil ist signiert, Fälschung erkennbar |
| Browser-Daten gelöscht Web | Recovery über Mnemonic - einziger Weg! |

### Best Practices

1. **Mnemonic NUR EINMAL anzeigen** - Wird nirgendwo gespeichert
2. **Quiz ist VERPFLICHTEND** - Kein Fortfahren ohne 3 richtige Antworten
3. **Navigation blockieren** - Zwischen Key-Generierung und Quiz-Abschluss
4. **Kein Cloud-Backup des Keys** - Nur Mnemonic auf Papier
5. **Biometrie optional** - Für App-Entsperrung, nicht für Key-Zugriff

### Recovery-Szenario

```mermaid
flowchart TD
    Loss(["Gerät verloren oder Daten gelöscht"]) --> HasPhrase{"Recovery-Phrase gesichert?"}
    
    HasPhrase -->|Ja| Recover["Neue App installieren und Wiederherstellen"]
    Recover --> Restored["Identität wiederhergestellt"]
    
    HasPhrase -->|Nein| Lost["Identität VERLOREN"]
    Lost --> NewID["Einzige Option: Neue ID erstellen"]
    NewID --> Reverify["Alle Kontakte müssen neu verifizieren"]
    NewID --> LostAttestations["Alte Attestationen verloren"]
    
    style Lost fill:#FF6B6B
    style LostAttestations fill:#FF6B6B
```
