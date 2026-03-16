# Encrypted Blob Store

> Concept for encrypted binary data (profile pictures, attachments) in the Web of Trust

**Status:** Planned — not yet implemented
**Priority:** MVP phase

---

## Problem

Binary data (images, documents) must **not** end up in CRDT docs:

- Every `transact` delta includes the binary data as a change
- `requestSync` sends the entire doc snapshot including all blobs
- A space with 10 profile pictures at 100KB each = 1MB per sync

At the same time, users want certain data (e.g. a profile picture) to remain private,
but still be shareable with trusted contacts.

## Three Visibility Levels

| Level | Example | Storage | Access |
|-------|---------|---------|--------|
| **Public** | Name, bio | wot-profiles (`GET /p/{did}`) | Anyone |
| **Contacts** | Profile picture, phone | Encrypted Blob Store | Whoever has the key |
| **Space** | Project files | Encrypted Blob Store (space key) | Space members |

## Architecture

```
User                            Server (wot-profiles)
----                            ---------------------

Profile picture (plaintext)
    |
    v
AES-256-GCM encrypt
(with "contact blob key")
    |
    v
PUT /blob/{did}/{hash}  ------>  Stores ciphertext
                                 (cannot read content)

Contact wants to see picture:
GET /blob/{did}/{hash}  <------  Returns ciphertext
    |
    v
AES-256-GCM decrypt
(with contact blob key)
    |
    v
Profile picture (plaintext)
```

## Key Distribution

The blob key is shared **once** at contact time via ECIES:

```
Anton verifies Bob
    |
    v
ECIES(blob-key, bob-encryption-pubkey) ---> Bob
    |
    Bob stores Anton's blob-key locally
    Bob can now read all of Anton's private blobs
```

### Advantages over a Messaging Approach

| Aspect | Messaging (worse) | Blob Store (better) |
|--------|-------------------|---------------------|
| Change picture | n messages to n contacts | 1 PUT, contacts fetch themselves |
| New contact | Send again | Share key, contact fetches |
| Contact offline | Redelivery problem | Fetches when online |
| Cache cleared | Send again | Fetch again |
| Bandwidth | n × image size | 1 × image size + n × key size |

### Why not encrypt the image separately for each contact?

That would be O(n) encryption operations per blob upload. Instead:

- **1 symmetric key per visibility level** (e.g. "contacts key")
- Blob is encrypted once with this key
- The key is shared via ECIES to each contact (once, at contact time)
- Key rotation when a contact is removed (analogous to space group key rotation)

## Referencing

The CRDT doc or profile JSON stores only the reference:

```json
{
  "avatar": {
    "hash": "sha256:abc123...",
    "scope": "contacts"
  }
}
```

The client resolves:

1. `hash` → `GET /blob/{did}/{hash}`
2. `scope: "contacts"` → use local contact blob key
3. Decrypt + display

## Integration with wot-profiles

wot-profiles would be extended with a blob endpoint:

```
GET  /p/{did}              -- Public profile (JSON, plaintext)
PUT  /p/{did}              -- Update public profile (JWS-signed)

GET  /blob/{did}/{hash}    -- Fetch encrypted blob
PUT  /blob/{did}/{hash}    -- Upload encrypted blob (JWS-signed)
DELETE /blob/{did}/{hash}  -- Delete blob (JWS-signed)
```

The server stores only ciphertext. It cannot determine the content type
(image vs. document) or read the payload.

## Scope Keys

| Scope | Key | Shared with | Rotation |
|-------|-----|-------------|----------|
| `contacts` | Contact blob key | All verified contacts | On contact removal |
| `space:{id}` | Space group key | Space members | On member removal (already implemented) |
| `public` | No key (plaintext) | Everyone | Never |

For spaces we can reuse the existing **GroupKeyService** —
the space group key then encrypts both CRDT changes and blobs.

## Priority

- **POC:** Not needed. Profile pictures public via wot-profiles or not at all.
- **MVP:** Implement contact blob key for private profile pictures.
- **Production:** Scope keys, space blobs, key rotation.

## Relationship to Item-Keys and Auto-Group

### Two Encryption Mechanisms — Intentionally Separate

The WoT uses two complementary encryption approaches:

|  | Item-Keys | Contact Blob Key (Blob Store) |
|--|-----------|-------------------------------|
| **Data type** | Structured items (calendar, notes, attestations) | Binary data (profile pictures, thumbnails) |
| **Granularity** | Selectable per item (`contacts`, `selective`, `groups`) | Per scope (all contacts or space) |
| **Selective visibility** | Yes — item X only for Anna and Ben | No — all contacts or nobody |
| **Cost per item** | O(N) encryptions per item | O(1) per blob |
| **Key distribution** | Per item, per recipient | Once at contact time |

### Role of the Auto-Group

The auto-group is **not an encryption mechanism**,
it is a **recipient list**: it answers the question *"Who are all my active contacts?"*

- With **Item-Keys** and `visibility: contacts`: item key is wrapped for each member of the auto-group
- With the **Blob Store** and `scope: contacts`: contact blob key is distributed once to each member of the auto-group

The contact blob key is conceptually a **group key for the auto-group** —
analogous to the space group key, but for the implicit group of all active contacts.
The `excludedMembers` mechanism of the auto-group applies to both approaches:

- Item-Keys: excluded contact does not receive a new item key
- Blob Store: key rotation on contact removal (analogous to space group key rotation)

### Why not use Item-Keys for blobs too?

Item-Keys are optimized for **many small items** that change infrequently.
A profile picture is a **single large blob** that changes infrequently —
but is frequently fetched by many contacts. A shared scope key is more efficient:

- No O(N) per blob upload
- No redelivery problem for offline contacts
- Contacts fetch the blob themselves when they come online

## Scope

This blob store is **not** a generic file storage system. It is optimized for:

- Small to medium blobs (profile pictures, thumbnails: < 1MB)
- Infrequent writes (changing a profile picture)
- Frequent reads (contact displays profile picture)

For large files (videos, documents) in spaces a different approach would be needed
(e.g. chunking + content addressing), but that is outside the current scope.
