export type SyncState = 'idle' | 'syncing' | 'error'

export interface SyncChange {
  type: 'identity' | 'contact' | 'verification' | 'attestation'
  action: 'create' | 'update' | 'delete'
  id: string
  data?: unknown
  timestamp: string
}

export interface SyncAdapter {
  // Connection
  connect(peerId: string): Promise<void>
  disconnect(peerId: string): Promise<void>
  isConnected(peerId: string): boolean

  // Sync
  sync(peerId: string): Promise<void>
  syncAll(): Promise<void>

  // State
  getState(): SyncState
  getPeers(): string[]

  // Events
  onRemoteChange(callback: (changes: SyncChange[]) => void): () => void
  onStateChange(callback: (state: SyncState) => void): () => void
}

// Placeholder implementation for later CRDT integration
export class NoOpSyncAdapter implements SyncAdapter {
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  isConnected(): boolean { return false }
  async sync(): Promise<void> {}
  async syncAll(): Promise<void> {}
  getState(): SyncState { return 'idle' }
  getPeers(): string[] { return [] }
  onRemoteChange(): () => void { return () => {} }
  onStateChange(): () => void { return () => {} }
}
