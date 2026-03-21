/**
 * WotCliClient — Headless WoT client for Node.js.
 *
 * Same adapter stack as the Demo App's AdapterContext,
 * but without React, without IndexedDB, without browser APIs.
 *
 * Uses: SQLite for persistence, WebSocket for relay, HTTP for discovery.
 */

import {
  WotIdentity,
  WebSocketMessagingAdapter,
  HttpDiscoveryAdapter,
  OfflineFirstDiscoveryAdapter,
  OutboxMessagingAdapter,
  GroupKeyService,
  PersonalDocSpaceMetadataStorage,
  InMemoryPublishStateStore,
  InMemoryGraphCacheStore,
  encodeBase64Url,
  type StorageAdapter,
  type ReactiveStorageAdapter,
  type SpaceInfo,
  type Contact,
  type MessageEnvelope,
  type MessageType,
} from '@real-life/wot-core'
import {
  YjsReplicationAdapter,
  initYjsPersonalDoc,
  getYjsPersonalDoc,
  changeYjsPersonalDoc,
  YjsStorageAdapter,
  flushYjsPersonalDoc,
  refreshYjsPersonalDocFromVault,
} from '@real-life/adapter-yjs'
import { FileBasedSeedStorage } from './storage/FileBasedSeedStorage.js'
import { SqliteCompactStore } from './storage/SqliteCompactStore.js'
import { SqliteOutboxStore } from './storage/SqliteOutboxStore.js'

export interface WotCliClientOptions {
  /** Path to encrypted seed file */
  seedPath: string
  /** Path to SQLite database for CRDT snapshots + spaces */
  dbPath?: string
  /** WebSocket relay URL */
  relayUrl?: string
  /** Profile discovery server URL */
  profileServiceUrl?: string
  /** Vault URL for encrypted backups */
  vaultUrl?: string
}

export class WotCliClient {
  private identity: WotIdentity
  private wsAdapter: WebSocketMessagingAdapter | null = null
  private outboxAdapter: OutboxMessagingAdapter | null = null
  private replication: YjsReplicationAdapter | null = null
  private storage: (StorageAdapter & ReactiveStorageAdapter) | null = null
  private discovery: OfflineFirstDiscoveryAdapter | null = null
  private compactStore: SqliteCompactStore | null = null
  private outboxStore: SqliteOutboxStore | null = null
  private options: Required<WotCliClientOptions>

  constructor(options: WotCliClientOptions) {
    this.identity = new WotIdentity()
    this.options = {
      seedPath: options.seedPath,
      dbPath: options.dbPath ?? './data/wot-cli.db',
      relayUrl: options.relayUrl ?? 'wss://relay.utopia-lab.org',
      profileServiceUrl: options.profileServiceUrl ?? 'https://profiles.utopia-lab.org',
      vaultUrl: options.vaultUrl ?? 'https://vault.utopia-lab.org',
    }
  }

  /**
   * Initialize: load seed, unlock identity, set up adapters.
   */
  async init(passphrase: string): Promise<void> {
    // 1. Load mnemonic and unlock identity
    const seedStorage = new FileBasedSeedStorage(this.options.seedPath)
    const mnemonic = await seedStorage.loadMnemonic(passphrase)

    this.identity = new WotIdentity()
    await this.identity.unlock(mnemonic, passphrase, false)

    const did = this.identity.getDid()
    console.log(`[wot-cli] Identity unlocked: ${did.slice(0, 30)}...`)

    // 2. WebSocket relay
    this.wsAdapter = new WebSocketMessagingAdapter(this.options.relayUrl)

    // 3. SQLite stores
    this.compactStore = new SqliteCompactStore(this.options.dbPath)
    this.outboxStore = new SqliteOutboxStore(this.options.dbPath.replace('.db', '-outbox.db'))

    // 4. Outbox messaging (queues messages when offline)
    this.outboxAdapter = new OutboxMessagingAdapter(this.wsAdapter, this.outboxStore, {
      skipTypes: ['content', 'profile-update', 'attestation-ack', 'personal-sync'] as MessageType[],
      sendTimeoutMs: 15_000,
    })

    // 5. Personal doc (Yjs)
    await initYjsPersonalDoc(this.identity, this.wsAdapter, this.options.vaultUrl)
    this.storage = new YjsStorageAdapter(did)

    // 6. Discovery
    const httpDiscovery = new HttpDiscoveryAdapter(this.options.profileServiceUrl)
    const publishStateStore = new InMemoryPublishStateStore()
    const graphCacheStore = new InMemoryGraphCacheStore()
    this.discovery = new OfflineFirstDiscoveryAdapter(httpDiscovery, publishStateStore, graphCacheStore)

    // 7. Replication (Yjs spaces)
    const groupKeyService = new GroupKeyService()
    const spaceMetadataStorage = new PersonalDocSpaceMetadataStorage({
      getPersonalDoc: getYjsPersonalDoc,
      changePersonalDoc: changeYjsPersonalDoc,
    })

    this.replication = new YjsReplicationAdapter({
      identity: this.identity,
      messaging: this.outboxAdapter,
      groupKeyService,
      metadataStorage: spaceMetadataStorage,
      compactStore: this.compactStore,
      vaultUrl: this.options.vaultUrl,
      flushPersonalDoc: flushYjsPersonalDoc,
      refreshPersonalDocFromVault: refreshYjsPersonalDocFromVault,
    })

    // 8. Ensure identity in personal doc
    const existing = await this.storage.getIdentity()
    if (!existing) {
      await this.storage.createIdentity(did, { name: 'Eli', bio: 'WoT AI Teammate' })
    }

    console.log('[wot-cli] Adapters initialized')
  }

  /**
   * Connect to relay and start sync.
   */
  async connect(): Promise<void> {
    if (!this.wsAdapter || !this.replication) {
      throw new Error('Call init() first')
    }

    const did = this.identity.getDid()

    try {
      await Promise.race([
        this.wsAdapter.connect(did),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ])
      console.log('[wot-cli] Connected to relay')
    } catch {
      console.warn('[wot-cli] Relay not available, running offline')
    }

    // Start replication (restores spaces, listens for messages)
    await this.replication.start()
    console.log('[wot-cli] Replication started')
  }

  /**
   * Disconnect and clean up.
   */
  async disconnect(): Promise<void> {
    if (this.replication) await this.replication.stop()
    if (this.wsAdapter) this.wsAdapter.disconnect()
    if (this.compactStore) this.compactStore.close()
    if (this.outboxStore) this.outboxStore.close()
    console.log('[wot-cli] Disconnected')
  }

  // --- Identity ---

  getDid(): string {
    return this.identity.getDid()
  }

  async getProfile() {
    if (!this.storage) throw new Error('Not initialized')
    return this.storage.getIdentity()
  }

  // --- Contacts ---

  async getContacts(): Promise<Contact[]> {
    if (!this.storage) throw new Error('Not initialized')
    return this.storage.getContacts()
  }

  // --- Spaces ---

  getSpaces(): SpaceInfo[] {
    if (!this.replication) throw new Error('Not initialized')
    const sub = this.replication.watchSpaces()
    return sub.getValue() ?? []
  }

  async getSpaceItems(spaceId: string): Promise<Record<string, unknown>> {
    if (!this.replication) throw new Error('Not initialized')
    const space = await this.replication.getSpace(spaceId)
    if (!space) return {}
    // getSpace returns SpaceInfo, we need the SpaceHandle from openSpace
    const handle = await this.replication.openSpace(spaceId)
    if (!handle) return {}
    const doc = handle.getDoc()
    return JSON.parse(JSON.stringify(doc))
  }

  async createSpaceItem(spaceId: string, itemId: string, data: Record<string, unknown>): Promise<void> {
    if (!this.replication) throw new Error('Not initialized')
    const handle = await this.replication.openSpace(spaceId)
    if (!handle) throw new Error(`Space ${spaceId} not found`)
    handle.transact((doc: any) => {
      doc[itemId] = data
    })
  }

  async updateSpaceItem(spaceId: string, itemId: string, updates: Record<string, unknown>): Promise<void> {
    if (!this.replication) throw new Error('Not initialized')
    const handle = await this.replication.openSpace(spaceId)
    if (!handle) throw new Error(`Space ${spaceId} not found`)
    handle.transact((doc: any) => {
      if (!doc[itemId]) doc[itemId] = {}
      Object.assign(doc[itemId] as Record<string, unknown>, updates)
    })
  }

  // --- Messaging ---

  async sendMessage(toDid: string, type: MessageType, payload: unknown): Promise<void> {
    if (!this.outboxAdapter) throw new Error('Not initialized')
    const envelope: MessageEnvelope = {
      v: 1,
      id: crypto.randomUUID(),
      type,
      fromDid: this.identity.getDid(),
      toDid,
      createdAt: new Date().toISOString(),
      encoding: 'json',
      payload: JSON.stringify(payload),
      signature: '',
    }
    await this.outboxAdapter.send(envelope)
  }

  // --- Discovery ---

  async publishProfile(): Promise<void> {
    if (!this.discovery || !this.storage) throw new Error('Not initialized')
    const ident = await this.storage.getIdentity()
    if (!ident) throw new Error('No identity')

    const encPubKeyBytes = await this.identity.getEncryptionPublicKeyBytes()
    const encPubKey = encodeBase64Url(encPubKeyBytes)

    const profile = {
      did: this.identity.getDid(),
      name: ident.profile.name ?? 'Eli',
      bio: ident.profile.bio,
      encryptionPublicKey: encPubKey,
      updatedAt: new Date().toISOString(),
    }

    await this.discovery.publishProfile(profile, this.identity)
    console.log('[wot-cli] Profile published')
  }
}
