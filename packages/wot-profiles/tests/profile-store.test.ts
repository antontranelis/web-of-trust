import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProfileStore } from '../src/profile-store.js'

describe('ProfileStore', () => {
  let store: ProfileStore

  beforeEach(() => {
    store = new ProfileStore(':memory:')
  })

  afterEach(() => {
    store.close()
  })

  it('should store and retrieve a JWS by DID', () => {
    const did = 'did:key:z6MkTest123'
    const jws = 'eyJhbGciOiJFZERTQSJ9.eyJkaWQiOiJ0ZXN0In0.signature'

    store.put(did, jws)
    const result = store.get(did)

    expect(result).not.toBeNull()
    expect(result!.jws).toBe(jws)
    expect(result!.did).toBe(did)
  })

  it('should return null for unknown DID', () => {
    const result = store.get('did:key:z6MkUnknown')
    expect(result).toBeNull()
  })

  it('should upsert (update existing DID)', () => {
    const did = 'did:key:z6MkTest123'
    const jws1 = 'eyJhbGciOiJFZERTQSJ9.v1.sig1'
    const jws2 = 'eyJhbGciOiJFZERTQSJ9.v2.sig2'

    store.put(did, jws1)
    store.put(did, jws2)
    const result = store.get(did)

    expect(result!.jws).toBe(jws2)
  })

  it('should persist updated_at timestamp', () => {
    const did = 'did:key:z6MkTest123'
    const jws = 'eyJhbGciOiJFZERTQSJ9.eyJkaWQiOiJ0ZXN0In0.signature'

    store.put(did, jws)
    const result = store.get(did)

    expect(result!.updatedAt).toBeDefined()
    // Should be a valid ISO date
    expect(new Date(result!.updatedAt).toISOString()).toBe(result!.updatedAt)
  })
})
