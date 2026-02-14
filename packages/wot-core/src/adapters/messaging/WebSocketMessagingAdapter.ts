import type { MessagingAdapter } from '../interfaces/MessagingAdapter'
import type {
  MessageEnvelope,
  DeliveryReceipt,
  MessagingState,
} from '../../types/messaging'

/**
 * WebSocket-based messaging adapter that connects to a relay server.
 *
 * Uses the browser-native WebSocket API (no `ws` dependency needed).
 * The relay is blind — it only forwards envelopes without inspecting payloads.
 *
 * Protocol:
 * - Client sends: { type: 'register', did } | { type: 'send', envelope }
 * - Relay sends:  { type: 'registered', did } | { type: 'message', envelope }
 *                 | { type: 'receipt', receipt } | { type: 'error', code, message }
 */
export class WebSocketMessagingAdapter implements MessagingAdapter {
  private ws: WebSocket | null = null
  private state: MessagingState = 'disconnected'
  private messageCallbacks = new Set<(envelope: MessageEnvelope) => void>()
  private receiptCallbacks = new Set<(receipt: DeliveryReceipt) => void>()
  private stateCallbacks = new Set<(state: MessagingState) => void>()
  private transportMap = new Map<string, string>()
  private pendingReceipts = new Map<string, (receipt: DeliveryReceipt) => void>()

  constructor(private relayUrl: string) {}

  private setState(newState: MessagingState) {
    this.state = newState
    for (const cb of this.stateCallbacks) {
      cb(newState)
    }
  }

  onStateChange(callback: (state: MessagingState) => void): () => void {
    this.stateCallbacks.add(callback)
    return () => { this.stateCallbacks.delete(callback) }
  }

  async connect(myDid: string): Promise<void> {
    if (this.state === 'connected') {
      await this.disconnect()
    }

    this.setState('connecting')

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.relayUrl)

      this.ws.onopen = () => {
        this.ws!.send(JSON.stringify({ type: 'register', did: myDid }))
      }

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString())

        switch (msg.type) {
          case 'registered':
            this.setState('connected')
            resolve()
            break

          case 'message':
            for (const cb of this.messageCallbacks) {
              cb(msg.envelope as MessageEnvelope)
            }
            break

          case 'receipt': {
            const receipt = msg.receipt as DeliveryReceipt
            // Resolve pending send() promise if waiting
            const pending = this.pendingReceipts.get(receipt.messageId)
            if (pending) {
              this.pendingReceipts.delete(receipt.messageId)
              pending(receipt)
            }
            // Notify receipt callbacks
            for (const cb of this.receiptCallbacks) {
              cb(receipt)
            }
            break
          }

          case 'error':
            if (this.state === 'connecting') {
              this.setState('error')
              reject(new Error(`Relay error: ${msg.message}`))
            }
            break
        }
      }

      this.ws.onerror = () => {
        if (this.state === 'connecting') {
          this.setState('error')
          reject(new Error(`WebSocket connection failed to ${this.relayUrl}`))
        }
      }

      this.ws.onclose = () => {
        this.setState('disconnected')
      }
    })
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setState('disconnected')
  }

  getState(): MessagingState {
    return this.state
  }

  async send(envelope: MessageEnvelope): Promise<DeliveryReceipt> {
    if (this.state !== 'connected' || !this.ws) {
      throw new Error('WebSocketMessagingAdapter: must call connect() before send()')
    }

    return new Promise<DeliveryReceipt>((resolve) => {
      // Register pending receipt handler
      this.pendingReceipts.set(envelope.id, resolve)

      // Send to relay
      this.ws!.send(JSON.stringify({ type: 'send', envelope }))
    })
  }

  onMessage(callback: (envelope: MessageEnvelope) => void): () => void {
    this.messageCallbacks.add(callback)
    return () => {
      this.messageCallbacks.delete(callback)
    }
  }

  onReceipt(callback: (receipt: DeliveryReceipt) => void): () => void {
    this.receiptCallbacks.add(callback)
    return () => {
      this.receiptCallbacks.delete(callback)
    }
  }

  async registerTransport(did: string, transportAddress: string): Promise<void> {
    this.transportMap.set(did, transportAddress)
  }

  async resolveTransport(did: string): Promise<string | null> {
    return this.transportMap.get(did) ?? null
  }
}
