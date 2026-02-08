import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import WebSocket from 'ws'
import { RelayServer } from '../src/relay.js'
import type { MessageEnvelope, DeliveryReceipt, MessagingAdapter } from '@real-life/wot-core'
import { createResourceRef } from '@real-life/wot-core'

const PORT = 9877
const RELAY_URL = `ws://localhost:${PORT}`

const ALICE_DID = 'did:key:z6MkAlice1234567890abcdefghijklmnopqrstuvwxyz'
const BOB_DID = 'did:key:z6MkBob1234567890abcdefghijklmnopqrstuvwxyzab'

/**
 * Minimal WebSocket MessagingAdapter for Node.js tests.
 * Uses the `ws` library (since we're in Node.js, not browser).
 * This mirrors the browser WebSocketMessagingAdapter from wot-core.
 */
class NodeWebSocketAdapter implements MessagingAdapter {
  private ws: WebSocket | null = null
  private myDid: string | null = null
  private state: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private messageCallbacks = new Set<(envelope: MessageEnvelope) => void>()
  private receiptCallbacks = new Set<(receipt: DeliveryReceipt) => void>()
  private pendingReceipts = new Map<string, (receipt: DeliveryReceipt) => void>()

  constructor(private relayUrl: string) {}

  async connect(myDid: string): Promise<void> {
    this.myDid = myDid
    this.state = 'connecting'

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.relayUrl)

      this.ws.on('open', () => {
        this.ws!.send(JSON.stringify({ type: 'register', did: myDid }))
      })

      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString())

        switch (msg.type) {
          case 'registered':
            this.state = 'connected'
            resolve()
            break
          case 'message':
            for (const cb of this.messageCallbacks) {
              cb(msg.envelope as MessageEnvelope)
            }
            break
          case 'receipt': {
            const receipt = msg.receipt as DeliveryReceipt
            const pending = this.pendingReceipts.get(receipt.messageId)
            if (pending) {
              this.pendingReceipts.delete(receipt.messageId)
              pending(receipt)
            }
            for (const cb of this.receiptCallbacks) {
              cb(receipt)
            }
            break
          }
          case 'error':
            if (this.state === 'connecting') {
              this.state = 'error'
              reject(new Error(msg.message))
            }
            break
        }
      })

      this.ws.on('error', () => {
        if (this.state === 'connecting') {
          this.state = 'error'
          reject(new Error('Connection failed'))
        }
      })

      this.ws.on('close', () => {
        this.state = 'disconnected'
      })
    })
  }

  async disconnect(): Promise<void> {
    this.ws?.close()
    this.ws = null
    this.myDid = null
    this.state = 'disconnected'
  }

  getState() {
    return this.state
  }

  async send(envelope: MessageEnvelope): Promise<DeliveryReceipt> {
    if (this.state !== 'connected' || !this.ws) {
      throw new Error('Must connect first')
    }
    return new Promise((resolve) => {
      this.pendingReceipts.set(envelope.id, resolve)
      this.ws!.send(JSON.stringify({ type: 'send', envelope }))
    })
  }

  onMessage(callback: (envelope: MessageEnvelope) => void): () => void {
    this.messageCallbacks.add(callback)
    return () => { this.messageCallbacks.delete(callback) }
  }

  onReceipt(callback: (receipt: DeliveryReceipt) => void): () => void {
    this.receiptCallbacks.add(callback)
    return () => { this.receiptCallbacks.delete(callback) }
  }

  async registerTransport(): Promise<void> {}
  async resolveTransport(): Promise<string | null> { return null }
}

function createTestEnvelope(
  fromDid: string,
  toDid: string,
  overrides: Partial<MessageEnvelope> = {},
): MessageEnvelope {
  return {
    v: 1,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'attestation',
    fromDid,
    toDid,
    createdAt: new Date().toISOString(),
    encoding: 'json',
    payload: JSON.stringify({ claim: 'test-claim' }),
    signature: 'test-signature-base64',
    ...overrides,
  }
}

describe('Integration: MessagingAdapter over WebSocket Relay', () => {
  let server: RelayServer
  let alice: NodeWebSocketAdapter
  let bob: NodeWebSocketAdapter

  beforeEach(async () => {
    server = new RelayServer({ port: PORT })
    await server.start()
    alice = new NodeWebSocketAdapter(RELAY_URL)
    bob = new NodeWebSocketAdapter(RELAY_URL)
  })

  afterEach(async () => {
    await alice.disconnect()
    await bob.disconnect()
    await server.stop()
  })

  it('should send attestation from Alice to Bob', async () => {
    await alice.connect(ALICE_DID)
    await bob.connect(BOB_DID)

    const received: MessageEnvelope[] = []
    bob.onMessage((env) => received.push(env))

    const envelope = createTestEnvelope(ALICE_DID, BOB_DID)
    const receipt = await alice.send(envelope)

    expect(receipt.status).toBe('delivered')
    expect(receipt.messageId).toBe(envelope.id)

    // Give a tick for delivery
    await new Promise((r) => setTimeout(r, 50))

    expect(received).toHaveLength(1)
    expect(received[0].fromDid).toBe(ALICE_DID)
    expect(received[0].type).toBe('attestation')
    expect(received[0].payload).toBe(envelope.payload)
  })

  it('should send all message types', async () => {
    await alice.connect(ALICE_DID)
    await bob.connect(BOB_DID)

    const received: MessageEnvelope[] = []
    bob.onMessage((env) => received.push(env))

    const types = [
      'verification', 'attestation', 'contact-request', 'item-key',
      'space-invite', 'group-key-rotation', 'ack', 'content',
    ] as const

    for (const type of types) {
      await alice.send(createTestEnvelope(ALICE_DID, BOB_DID, { type }))
    }

    await new Promise((r) => setTimeout(r, 50))

    expect(received).toHaveLength(types.length)
    expect(received.map((e) => e.type)).toEqual([...types])
  })

  it('should include ResourceRef in envelope', async () => {
    await alice.connect(ALICE_DID)
    await bob.connect(BOB_DID)

    const received: MessageEnvelope[] = []
    bob.onMessage((env) => received.push(env))

    const ref = createResourceRef('attestation', 'att-999')
    await alice.send(createTestEnvelope(ALICE_DID, BOB_DID, { ref }))

    await new Promise((r) => setTimeout(r, 50))

    expect(received[0].ref).toBe('wot:attestation:att-999')
  })

  it('should deliver offline-queued messages', async () => {
    await alice.connect(ALICE_DID)
    // Bob is NOT connected yet

    const envelope = createTestEnvelope(ALICE_DID, BOB_DID)
    const receipt = await alice.send(envelope)
    expect(receipt.status).toBe('accepted') // queued

    // Bob connects and should receive the queued message
    const received: MessageEnvelope[] = []
    bob.onMessage((env) => received.push(env))
    await bob.connect(BOB_DID)

    await new Promise((r) => setTimeout(r, 50))

    expect(received).toHaveLength(1)
    expect(received[0].id).toBe(envelope.id)
  })

  it('should notify sender via onReceipt callback', async () => {
    await alice.connect(ALICE_DID)
    await bob.connect(BOB_DID)

    const receipts: DeliveryReceipt[] = []
    alice.onReceipt((r) => receipts.push(r))

    const envelope = createTestEnvelope(ALICE_DID, BOB_DID)
    await alice.send(envelope)

    expect(receipts.some((r) => r.status === 'delivered')).toBe(true)
  })

  it('should handle bidirectional messaging', async () => {
    await alice.connect(ALICE_DID)
    await bob.connect(BOB_DID)

    const aliceReceived: MessageEnvelope[] = []
    const bobReceived: MessageEnvelope[] = []
    alice.onMessage((env) => aliceReceived.push(env))
    bob.onMessage((env) => bobReceived.push(env))

    // Alice → Bob
    await alice.send(createTestEnvelope(ALICE_DID, BOB_DID))
    // Bob → Alice
    await bob.send(createTestEnvelope(BOB_DID, ALICE_DID))

    await new Promise((r) => setTimeout(r, 50))

    expect(bobReceived).toHaveLength(1)
    expect(aliceReceived).toHaveLength(1)
    expect(bobReceived[0].fromDid).toBe(ALICE_DID)
    expect(aliceReceived[0].fromDid).toBe(BOB_DID)
  })
})
