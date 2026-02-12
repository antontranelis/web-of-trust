import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { WotIdentity } from '@real-life/wot-core'
import { ProfileServer } from '../src/server.js'

const PORT = 9877
const BASE_URL = `http://localhost:${PORT}`

describe('Profile REST API', () => {
  let server: ProfileServer
  let identity: WotIdentity
  let did: string

  beforeAll(async () => {
    // Start server
    server = new ProfileServer({ port: PORT, dbPath: ':memory:' })
    await server.start()

    // Create identity for signing
    identity = new WotIdentity()
    const result = await identity.create('test-passphrase', false)
    did = result.did
  })

  afterAll(async () => {
    await server.stop()
    try {
      await identity.deleteStoredIdentity()
    } catch {
      // Ignore
    }
  })

  async function createSignedProfile(
    profileDid: string,
    name: string,
  ): Promise<string> {
    const profile = {
      did: profileDid,
      name,
      updatedAt: new Date().toISOString(),
    }
    return identity.signJws(profile)
  }

  describe('PUT /p/{did}', () => {
    it('should accept valid JWS and return 200', async () => {
      const jws = await createSignedProfile(did, 'Alice')
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(200)
    })

    it('should reject mismatched DID (payload.did ≠ URL DID) with 403', async () => {
      const jws = await createSignedProfile(did, 'Alice')
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent('did:key:z6MkOtherDid123')}`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(403)
    })

    it('should reject invalid JWS with 400', async () => {
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}`, {
        method: 'PUT',
        body: 'not-a-valid-jws',
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(400)
    })

    it('should reject empty body with 400', async () => {
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}`, {
        method: 'PUT',
        body: '',
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /p/{did}', () => {
    it('should return stored JWS', async () => {
      const jws = await createSignedProfile(did, 'Alice Updated')
      await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })

      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}`)
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe(jws)
    })

    it('should return 404 for unknown DID', async () => {
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent('did:key:z6MkNobody123')}`)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /p/{did}/v (verifications)', () => {
    it('should accept valid JWS and return 200', async () => {
      const payload = {
        did,
        verifications: [
          { id: 'v1', from: 'did:key:z6MkAlice', to: did, timestamp: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString(),
      }
      const jws = await identity.signJws(payload)
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}/v`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(200)
    })

    it('should reject mismatched DID with 403', async () => {
      const payload = {
        did,
        verifications: [],
        updatedAt: new Date().toISOString(),
      }
      const jws = await identity.signJws(payload)
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent('did:key:z6MkOther')}/v`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(403)
    })
  })

  describe('GET /p/{did}/v (verifications)', () => {
    it('should return stored JWS', async () => {
      const payload = {
        did,
        verifications: [{ id: 'v2', from: 'did:key:z6MkBob', to: did }],
        updatedAt: new Date().toISOString(),
      }
      const jws = await identity.signJws(payload)
      await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}/v`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })

      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}/v`)
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe(jws)
    })

    it('should return 404 for unknown DID', async () => {
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent('did:key:z6MkNobody')}/v`)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /p/{did}/a (attestations)', () => {
    it('should accept valid JWS and return 200', async () => {
      const payload = {
        did,
        attestations: [
          { id: 'a1', from: 'did:key:z6MkAlice', to: did, claim: 'Kann gut kochen' }
        ],
        updatedAt: new Date().toISOString(),
      }
      const jws = await identity.signJws(payload)
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}/a`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(200)
    })

    it('should reject mismatched DID with 403', async () => {
      const payload = {
        did,
        attestations: [],
        updatedAt: new Date().toISOString(),
      }
      const jws = await identity.signJws(payload)
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent('did:key:z6MkOther')}/a`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(res.status).toBe(403)
    })
  })

  describe('GET /p/{did}/a (attestations)', () => {
    it('should return stored JWS', async () => {
      const payload = {
        did,
        attestations: [{ id: 'a2', from: 'did:key:z6MkBob', to: did, claim: 'Hilfsbereit' }],
        updatedAt: new Date().toISOString(),
      }
      const jws = await identity.signJws(payload)
      await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}/a`, {
        method: 'PUT',
        body: jws,
        headers: { 'Content-Type': 'text/plain' },
      })

      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}/a`)
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe(jws)
    })

    it('should return 404 for unknown DID', async () => {
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent('did:key:z6MkNobody')}/a`)
      expect(res.status).toBe(404)
    })
  })

  describe('CORS', () => {
    it('should include Access-Control-Allow-Origin header', async () => {
      const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(did)}`)
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
    })
  })
})
