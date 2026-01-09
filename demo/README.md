# Web of Trust Demo

Eine Demo-Anwendung zum Testen des Web of Trust Konzepts. Dient als Testbed für verschiedene CRDT-Frameworks, Datenbanken und Backend-Systeme.

## Features

- **Identität erstellen**: Ed25519-Schlüsselpaar generieren, DID:key Format
- **Kontakte verifizieren**: Challenge-Response Protokoll via Copy/Paste (Dev-Mode)
- **Attestationen erstellen**: Fähigkeiten, Hilfe, Zusammenarbeit, Empfehlungen
- **Attestationen importieren/exportieren**: Base64-codiert mit Signaturverifikation

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Vite
- IndexedDB (via `idb` Library)
- Web Crypto API (Ed25519)

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  (React Components + Pages)                                 │
├─────────────────────────────────────────────────────────────┤
│                      Hooks Layer                             │
│  useIdentity, useContacts, useVerifications, useAttestations│
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  IdentityService, ContactService, VerificationService, etc. │
├─────────────────────────────────────────────────────────────┤
│                   Adapter Interfaces                         │
│  StorageAdapter, CryptoAdapter, SyncAdapter (Placeholder)   │
├─────────────────────────────────────────────────────────────┤
│                  Adapter Implementations                     │
│  LocalStorageAdapter (IndexedDB) │ WebCryptoAdapter (Ed25519)│
└─────────────────────────────────────────────────────────────┘
```

### Interface/Adapter Pattern

Die Demo verwendet ein Adapter-Pattern für maximale Austauschbarkeit:

- **StorageAdapter**: Abstrahiert Datenspeicherung (aktuell: IndexedDB)
- **CryptoAdapter**: Abstrahiert Kryptografie (aktuell: Web Crypto API)
- **SyncAdapter**: Placeholder für zukünftige CRDT-Sync-Implementierungen

## Installation

```bash
cd demo
npm install
npm run dev
```

Die App läuft dann unter <http://localhost:5173> (oder nächster freier Port).

## Multi-User Testing

Da die Demo im Dev-Mode läuft, werden QR-Codes durch Copy/Paste ersetzt:

### Verifizierung testen

1. **Tab A**: Öffne <http://localhost:5173> → Identität erstellen (z.B. "Alice")
2. **Tab B**: Öffne <http://localhost:5173> im Inkognito-Fenster → Identität erstellen (z.B. "Bob")
3. **Tab A**: Gehe zu "Verifizieren" → Kopiere den angezeigten Code
4. **Tab B**: Gehe zu "Verifizieren" → Füge Alices Code ein → Kopiere Bobs Antwort-Code
5. **Tab A**: Füge Bobs Antwort-Code ein
6. Beide Tabs zeigen nun den jeweils anderen als verifizierten Kontakt

### Attestationen testen

1. Erstelle eine Attestation in Tab A für den verifizierten Kontakt (Bob)
2. Klicke auf das Kopier-Icon bei der erstellten Attestation
3. Wechsle zu Tab B → Attestationen → "Importieren"
4. Füge den Code ein → "Importieren & Verifizieren"
5. Die Attestation erscheint in Tab B unter "Über mich"

## Projektstruktur

```
demo/src/
├── adapters/           # Interface-Definitionen & Implementierungen
│   ├── interfaces/     # StorageAdapter, CryptoAdapter, SyncAdapter
│   ├── storage/        # LocalStorageAdapter (IndexedDB)
│   └── crypto/         # WebCryptoAdapter (Ed25519)
├── components/         # React UI-Komponenten
│   ├── attestation/    # AttestationCard, AttestationList, Create, Import
│   ├── contacts/       # ContactList, ContactCard, AddContact
│   ├── identity/       # IdentityCard, CreateIdentity
│   ├── layout/         # AppShell, Navigation
│   └── verification/   # VerificationFlow, ShowCode, ScanCode
├── context/            # React Context (AdapterContext, IdentityContext)
├── hooks/              # Custom Hooks (useIdentity, useContacts, etc.)
├── pages/              # Seiten-Komponenten (Home, Identity, Contacts, etc.)
├── services/           # Business Logic (IdentityService, etc.)
└── types/              # TypeScript Definitionen
```

## Datenmodell

### Identity

```typescript
{
  did: string              // did:key:z6Mk...
  profile: {
    name: string
    bio?: string
    avatar?: string
  }
  createdAt: string
}
```

### Contact

```typescript
{
  did: string
  profile: { name, bio?, avatar? }
  verifiedAt?: string      // Wann verifiziert
  verifiedBy?: string      // Wer hat verifiziert (eigene DID)
  hidden: boolean
  addedAt: string
}
```

### Verification

```typescript
{
  id: string
  initiatorDid: string
  responderDid: string
  method: 'in-person' | 'video' | 'vouched'
  location?: string
  completedAt: string
  signatures: {
    initiator: string
    responder: string
  }
}
```

### Attestation

```typescript
{
  id: string
  type: 'skill' | 'help' | 'collaboration' | 'recommendation' | 'custom'
  issuerDid: string
  subjectDid: string
  content: string
  tags?: string[]
  signature: string
  createdAt: string
}
```

## Nächste Schritte

- [ ] CRDT-Adapter implementieren (Automerge oder Yjs)
- [ ] Sync zwischen Geräten
- [ ] QR-Code Scanner für Mobile
- [ ] Gruppen-Funktionalität
- [ ] Content-Sharing (Kalender, Karten, etc.)

## Lizenz

MIT
