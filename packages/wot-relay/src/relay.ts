import { WebSocketServer, type WebSocket } from 'ws'
import type { ClientMessage, RelayMessage } from './types.js'
import { OfflineQueue } from './queue.js'

export interface RelayServerOptions {
  port: number
  dbPath?: string // SQLite path, defaults to ':memory:' for tests
}

export class RelayServer {
  private wss: WebSocketServer | null = null
  private connections = new Map<string, WebSocket>() // DID → WebSocket
  private socketToDid = new Map<WebSocket, string>() // WebSocket → DID (reverse lookup)
  private queue: OfflineQueue

  constructor(private options: RelayServerOptions) {
    this.queue = new OfflineQueue(options.dbPath)
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({ port: this.options.port }, () => {
        resolve()
      })

      this.wss.on('connection', (ws) => {
        this.handleConnection(ws)
      })
    })
  }

  async stop(): Promise<void> {
    // Close all client connections
    for (const ws of this.connections.values()) {
      ws.close()
    }
    this.connections.clear()
    this.socketToDid.clear()

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve())
      })
      this.wss = null
    }

    // Close database
    this.queue.close()
  }

  get port(): number {
    return this.options.port
  }

  get connectedDids(): string[] {
    return [...this.connections.keys()]
  }

  private handleConnection(ws: WebSocket): void {
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage
        this.handleMessage(ws, msg)
      } catch {
        this.sendTo(ws, {
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Invalid JSON',
        })
      }
    })

    ws.on('close', () => {
      const did = this.socketToDid.get(ws)
      if (did) {
        this.connections.delete(did)
        this.socketToDid.delete(ws)
      }
    })
  }

  private handleMessage(ws: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
      case 'register':
        this.handleRegister(ws, msg.did)
        break
      case 'send':
        this.handleSend(ws, msg.envelope)
        break
    }
  }

  private handleRegister(ws: WebSocket, did: string): void {
    // Close existing connection for this DID (if any)
    const existing = this.connections.get(did)
    if (existing && existing !== ws) {
      existing.close()
    }

    this.connections.set(did, ws)
    this.socketToDid.set(ws, did)

    this.sendTo(ws, { type: 'registered', did })

    // Deliver queued messages
    const queued = this.queue.dequeue(did)
    for (const envelope of queued) {
      this.sendTo(ws, { type: 'message', envelope })
    }
  }

  private handleSend(ws: WebSocket, envelope: Record<string, unknown>): void {
    const senderDid = this.socketToDid.get(ws)
    if (!senderDid) {
      this.sendTo(ws, {
        type: 'error',
        code: 'NOT_REGISTERED',
        message: 'Must register before sending',
      })
      return
    }

    const toDid = envelope.toDid as string | undefined
    if (!toDid) {
      this.sendTo(ws, {
        type: 'error',
        code: 'MISSING_RECIPIENT',
        message: 'Envelope must have toDid field',
      })
      return
    }

    const messageId = (envelope.id as string) ?? 'unknown'
    const now = new Date().toISOString()

    // Try to deliver to connected recipient
    const recipientWs = this.connections.get(toDid)
    if (recipientWs) {
      this.sendTo(recipientWs, { type: 'message', envelope })

      // Notify sender: delivered
      this.sendTo(ws, {
        type: 'receipt',
        receipt: { messageId, status: 'delivered', timestamp: now },
      })
    } else {
      // Queue for offline delivery
      this.queue.enqueue(toDid, envelope)

      // Notify sender: accepted (queued)
      this.sendTo(ws, {
        type: 'receipt',
        receipt: { messageId, status: 'accepted', timestamp: now },
      })
    }
  }

  private sendTo(ws: WebSocket, msg: RelayMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }
}
