import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import WebSocket from 'ws'
import { RelayServer } from '../src/relay.js'
import type { RelayMessage, ClientMessage } from '../src/types.js'

const PORT = 9876
const RELAY_URL = `ws://localhost:${PORT}`

const ALICE_DID = 'did:key:z6MkAlice1234567890abcdefghijklmnopqrstuvwxyz'
const BOB_DID = 'did:key:z6MkBob1234567890abcdefghijklmnopqrstuvwxyzab'

function createClient(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
  })
}

function sendMsg(ws: WebSocket, msg: ClientMessage): void {
  ws.send(JSON.stringify(msg))
}

function waitForMessage(ws: WebSocket, timeout = 2000): Promise<RelayMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for message')), timeout)
    ws.once('message', (data) => {
      clearTimeout(timer)
      resolve(JSON.parse(data.toString()) as RelayMessage)
    })
  })
}

function collectMessages(ws: WebSocket, count: number, timeout = 2000): Promise<RelayMessage[]> {
  return new Promise((resolve, reject) => {
    const messages: RelayMessage[] = []
    const timer = setTimeout(() => reject(new Error(`Timeout: got ${messages.length}/${count} messages`)), timeout)
    const handler = (data: WebSocket.RawData) => {
      messages.push(JSON.parse(data.toString()) as RelayMessage)
      if (messages.length === count) {
        clearTimeout(timer)
        ws.off('message', handler)
        resolve(messages)
      }
    }
    ws.on('message', handler)
  })
}

function createTestEnvelope(fromDid: string, toDid: string) {
  return {
    v: 1,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'attestation',
    fromDid,
    toDid,
    createdAt: new Date().toISOString(),
    encoding: 'json',
    payload: JSON.stringify({ claim: 'test' }),
    signature: 'test-signature',
  }
}

describe('RelayServer', () => {
  let server: RelayServer

  beforeEach(async () => {
    server = new RelayServer({ port: PORT })
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('registration', () => {
    it('should confirm registration with registered message', async () => {
      const ws = await createClient(RELAY_URL)
      sendMsg(ws, { type: 'register', did: ALICE_DID })

      const msg = await waitForMessage(ws)
      expect(msg).toEqual({ type: 'registered', did: ALICE_DID })

      ws.close()
    })

    it('should track connected DIDs', async () => {
      const ws = await createClient(RELAY_URL)
      sendMsg(ws, { type: 'register', did: ALICE_DID })
      await waitForMessage(ws) // registered

      expect(server.connectedDids).toContain(ALICE_DID)

      ws.close()
    })
  })

  describe('send to online recipient', () => {
    it('should deliver message and return delivered receipt', async () => {
      const alice = await createClient(RELAY_URL)
      const bob = await createClient(RELAY_URL)

      sendMsg(alice, { type: 'register', did: ALICE_DID })
      sendMsg(bob, { type: 'register', did: BOB_DID })
      await waitForMessage(alice) // registered
      await waitForMessage(bob)   // registered

      const envelope = createTestEnvelope(ALICE_DID, BOB_DID)

      // Alice sends, Bob receives
      const bobPromise = waitForMessage(bob)
      const alicePromise = waitForMessage(alice)

      sendMsg(alice, { type: 'send', envelope })

      const bobMsg = await bobPromise
      expect(bobMsg.type).toBe('message')
      if (bobMsg.type === 'message') {
        expect(bobMsg.envelope.fromDid).toBe(ALICE_DID)
        expect(bobMsg.envelope.toDid).toBe(BOB_DID)
        expect(bobMsg.envelope.id).toBe(envelope.id)
      }

      // Alice gets delivered receipt
      const aliceMsg = await alicePromise
      expect(aliceMsg.type).toBe('receipt')
      if (aliceMsg.type === 'receipt') {
        expect(aliceMsg.receipt.messageId).toBe(envelope.id)
        expect(aliceMsg.receipt.status).toBe('delivered')
      }

      alice.close()
      bob.close()
    })
  })

  describe('send to offline recipient (queuing)', () => {
    it('should queue message and return accepted receipt', async () => {
      const alice = await createClient(RELAY_URL)
      sendMsg(alice, { type: 'register', did: ALICE_DID })
      await waitForMessage(alice) // registered

      // Bob is NOT connected
      const envelope = createTestEnvelope(ALICE_DID, BOB_DID)
      sendMsg(alice, { type: 'send', envelope })

      const receipt = await waitForMessage(alice)
      expect(receipt.type).toBe('receipt')
      if (receipt.type === 'receipt') {
        expect(receipt.receipt.status).toBe('accepted') // queued, not delivered
      }

      alice.close()
    })

    it('should deliver queued messages when recipient connects', async () => {
      const alice = await createClient(RELAY_URL)
      sendMsg(alice, { type: 'register', did: ALICE_DID })
      await waitForMessage(alice) // registered

      // Send 2 messages while Bob is offline, collect both receipts
      const env1 = createTestEnvelope(ALICE_DID, BOB_DID)
      const env2 = createTestEnvelope(ALICE_DID, BOB_DID)
      const receiptsPromise = collectMessages(alice, 2)
      sendMsg(alice, { type: 'send', envelope: env1 })
      sendMsg(alice, { type: 'send', envelope: env2 })
      await receiptsPromise // both accepted

      // Now Bob connects — should receive: registered + 2 queued messages
      const bob = await createClient(RELAY_URL)
      const bobMessages = collectMessages(bob, 3) // registered + 2 messages
      sendMsg(bob, { type: 'register', did: BOB_DID })

      const msgs = await bobMessages
      expect(msgs[0].type).toBe('registered')
      expect(msgs[1].type).toBe('message')
      expect(msgs[2].type).toBe('message')

      if (msgs[1].type === 'message' && msgs[2].type === 'message') {
        expect(msgs[1].envelope.id).toBe(env1.id)
        expect(msgs[2].envelope.id).toBe(env2.id)
      }

      alice.close()
      bob.close()
    })
  })

  describe('error cases', () => {
    it('should error when sending without registration', async () => {
      const ws = await createClient(RELAY_URL)
      const envelope = createTestEnvelope(ALICE_DID, BOB_DID)
      sendMsg(ws, { type: 'send', envelope })

      const msg = await waitForMessage(ws)
      expect(msg.type).toBe('error')
      if (msg.type === 'error') {
        expect(msg.code).toBe('NOT_REGISTERED')
      }

      ws.close()
    })

    it('should error on invalid JSON', async () => {
      const ws = await createClient(RELAY_URL)
      ws.send('not valid json {{{')

      const msg = await waitForMessage(ws)
      expect(msg.type).toBe('error')
      if (msg.type === 'error') {
        expect(msg.code).toBe('INVALID_MESSAGE')
      }

      ws.close()
    })
  })

  describe('disconnect', () => {
    it('should remove DID mapping on disconnect', async () => {
      const ws = await createClient(RELAY_URL)
      sendMsg(ws, { type: 'register', did: ALICE_DID })
      await waitForMessage(ws) // registered

      expect(server.connectedDids).toContain(ALICE_DID)

      ws.close()
      // Wait for close to propagate
      await new Promise((r) => setTimeout(r, 100))

      expect(server.connectedDids).not.toContain(ALICE_DID)
    })
  })

  describe('multiple clients', () => {
    it('should handle multiple simultaneous connections', async () => {
      const alice = await createClient(RELAY_URL)
      const bob = await createClient(RELAY_URL)
      const charlie = await createClient(RELAY_URL)

      sendMsg(alice, { type: 'register', did: ALICE_DID })
      sendMsg(bob, { type: 'register', did: BOB_DID })
      sendMsg(charlie, { type: 'register', did: 'did:key:z6MkCharlie' })

      await waitForMessage(alice)
      await waitForMessage(bob)
      await waitForMessage(charlie)

      expect(server.connectedDids).toHaveLength(3)

      alice.close()
      bob.close()
      charlie.close()
    })
  })
})
