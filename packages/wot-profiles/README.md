# @real-life/wot-profiles

Server-Implementierung des **DiscoveryAdapter** — das öffentliche Verzeichnis des Web of Trust.

## Rolle in der Architektur

wot-profiles ist die POC-Implementierung (`HttpDiscoveryAdapter`) des [DiscoveryAdapter](../../docs/protokolle/adapter-architektur-v2.md) — einer der 7 Adapter im WoT-Ecosystem. Der DiscoveryAdapter beantwortet die Frage: **"Wer ist diese DID?"** — bevor man mit der Person in Kontakt ist.

```text
Discovery (wot-profiles)  →  Messaging (wot-relay)  →  Replication (Automerge)
VOR dem Kontakt               ZWISCHEN bekannten DIDs   INNERHALB einer Gruppe
öffentlich, signiert          privat, E2EE              Group Key, CRDT
```

Der Service ist austauschbar — alternative Implementierungen (Automerge Auto-Groups, IPFS, DHT) können das gleiche `DiscoveryAdapter`-Interface implementieren.

## Konzept

Alle Daten sind Ed25519-signiert (JWS). Der Server prüft beim Schreiben die Signatur und stellt sicher, dass die DID im Payload mit der URL übereinstimmt. Clients verifizieren die Signatur beim Lesen selbst.

Kein Account-System, keine Authentifizierung — die kryptographische Signatur **ist** die Autorisierung.

## API

Alle Endpoints unterstützen CORS (`*`).

### Profile

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| `GET` | `/p/{did}` | Profil-JWS abrufen |
| `PUT` | `/p/{did}` | Profil-JWS speichern |

### Verifikationen

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| `GET` | `/p/{did}/v` | Verifikationen-JWS abrufen |
| `PUT` | `/p/{did}/v` | Verifikationen-JWS speichern |

### Attestationen

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| `GET` | `/p/{did}/a` | Attestationen-JWS abrufen |
| `PUT` | `/p/{did}/a` | Attestationen-JWS speichern |

### PUT-Validierung

1. Body darf nicht leer sein → `400`
2. JWS-Payload muss `did` enthalten → `400`
3. `payload.did` muss mit URL-DID übereinstimmen → `403`
4. Ed25519-Signatur muss gültig sein → `400`
5. Gespeichert → `200`

### GET-Antwort

- `200` mit `Content-Type: application/jws` — JWS-String
- `404` — Keine Daten für diese DID

### Payload-Formate (im JWS)

**Profil:**
```json
{
  "did": "did:key:z6Mk...",
  "name": "Alice",
  "bio": "...",
  "avatar": "data:image/...",
  "updatedAt": "2026-02-11T..."
}
```

**Verifikationen:**
```json
{
  "did": "did:key:z6Mk...",
  "verifications": [
    { "id": "...", "from": "did:key:...", "to": "did:key:...", "timestamp": "...", "proof": { ... } }
  ],
  "updatedAt": "2026-02-11T..."
}
```

**Attestationen:**
```json
{
  "did": "did:key:z6Mk...",
  "attestations": [
    { "id": "...", "from": "did:key:...", "to": "did:key:...", "claim": "...", "createdAt": "...", "proof": { ... } }
  ],
  "updatedAt": "2026-02-11T..."
}
```

## Entwicklung

```bash
# Aus dem Monorepo-Root:
pnpm --filter wot-profiles dev    # Startet auf Port 8788
pnpm --filter wot-profiles test   # Tests ausführen
```

### Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT` | `8788` | HTTP-Port |
| `DB_PATH` | `./profiles.db` | Pfad zur SQLite-Datenbank |

## Docker

```bash
cd packages/wot-profiles
docker compose up -d
```

Persistenz über Docker Volume `profiles-data` unter `/data/profiles.db`.

## Architektur

```
start.ts          Einstiegspunkt (PORT, DB_PATH aus env)
server.ts         HTTP-Routing, CORS, JWS-Validierung
profile-store.ts  SQLite-Storage (3 Tabellen: profiles, verifications, attestations)
jws-verify.ts     Standalone Ed25519/did:key JWS-Verifikation (keine wot-core-Abhängigkeit)
```

Der Service hat **keine Runtime-Abhängigkeit** auf `wot-core`. Die JWS-Verifikation (`jws-verify.ts`) implementiert Ed25519 + did:key-Auflösung eigenständig über die Web Crypto API.
