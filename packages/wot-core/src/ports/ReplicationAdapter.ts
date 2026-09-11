import type { SpaceInfo, SpaceDocMeta, SpaceMemberChange, IncomingSpaceInvite, ReplicationState } from '../types/space'
import type { Subscribable } from './Subscribable'

/**
 * Options for SpaceHandle.transact().
 */
export interface TransactOptions {
  /** Use debounced vault push instead of immediate. For streaming input (e.g. text editing). */
  stream?: boolean
}

/**
 * SpaceHandle — typed access to a CRDT space.
 *
 * Wraps the underlying CRDT doc (e.g. Automerge) and provides
 * transactional writes + remote update notifications.
 */
export interface SpaceHandle<T = unknown> {
  readonly id: string
  info(): SpaceInfo

  /** Get the current document state (read-only snapshot). */
  getDoc(): T

  /** Get space metadata from the shared _meta map. */
  getMeta(): SpaceDocMeta

  /** Apply a transactional change to the doc. Encrypts + broadcasts to members. */
  transact(fn: (doc: T) => void, options?: TransactOptions): void

  /**
   * Optional capability: like {@link transact}, but resolves only after the log
   * entry produced by EXACTLY this transaction is durably persisted
   * (persist-before-send) and rejects when that append fails. The durability ack
   * is bound to this transaction — never to unrelated log-head movement. A no-op
   * transaction resolves immediately. Callers needing the guarantee must
   * feature-detect (see hasDurableTransact) and MUST NOT fall back to
   * fire-and-forget writes for durability-gated flows.
   */
  transactDurable?(fn: (doc: T) => void): Promise<void>

  /** Fires when remote changes arrive and are applied. */
  onRemoteUpdate(callback: () => void): () => void

  /** Close this handle (unsubscribe from updates). */
  close(): void
}

/**
 * ReplicationAdapter — CRDT Sync for Multi-Device and Multi-User Spaces.
 *
 * Manages Automerge docs, encrypts changes with group keys,
 * and distributes via MessagingAdapter.
 */
export interface ReplicationAdapter {
  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  getState(): ReplicationState

  // Space Management
  createSpace<T>(type: 'personal' | 'shared', initialDoc: T, meta?: { name?: string; description?: string; appTag?: string }): Promise<SpaceInfo>
  updateSpace(spaceId: string, meta: SpaceDocMeta): Promise<void>
  getSpaces(): Promise<SpaceInfo[]>
  getSpace(spaceId: string): Promise<SpaceInfo | null>
  watchSpaces(): Subscribable<SpaceInfo[]>

  // Space Access
  openSpace<T>(spaceId: string): Promise<SpaceHandle<T>>

  // Membership
  addMember(spaceId: string, memberDid: string, memberEncryptionPublicKey: Uint8Array): Promise<void>
  removeMember(spaceId: string, memberDid: string): Promise<void>
  /**
   * Promote an active member to admin (Sync 005 Z.221). Caller MUST already be an
   * admin (client-enforced guard in the adapter); the target MUST be an active
   * member. Idempotent: re-promoting an existing admin is a no-op. Grow-only — no
   * demotion/admin-remove (deferred). The broker `admin-add` send path is a
   * Nicht-Ziel of this slice; this writes only the doc-internal `_admins` set.
   */
  promoteToAdmin(spaceId: string, memberDid: string): Promise<void>
  /** Remove local space state only; does not mutate membership or contact the broker. */
  forgetSpaceLocally(spaceId: string): Promise<void>
  leaveSpace(spaceId: string): Promise<void>
  onMemberChange(callback: (change: SpaceMemberChange) => void): () => void
  /**
   * Fired after an incoming space-invite was verified and applied. The wire payload
   * is an ECIES container — UI consumers subscribe here instead of parsing it.
   *
   * `admission` identifiziert die Aufnahme, auf die diese Mitgliedschaft
   * zurueckgeht (RLS-Spec 12 Regel 4) — dieselbe Projektion des
   * `_members`-Event-Sets wie `SpaceInfo.admission` nach dem Apply: eine
   * Wiederaufnahme nach Entfernung traegt eine hoehere Generation, eine blosse
   * Rotation und eine erneut zugestellte Einladung an ein weiterhin aktives
   * Mitglied aendern sie nicht. Optional: ein Invite ohne Doc-Snapshot traegt
   * noch keine Ereignisse, die Kennung kommt dann mit dem Doc-Sync nach.
   */
  onSpaceInvite?(callback: (invite: IncomingSpaceInvite) => void): () => void

  // Sync
  requestSync(spaceId: string): Promise<void>

  // Key info (for testing/debugging)
  getKeyGeneration(spaceId: string): Promise<number>
}

/** Optional atomic membership/activity primitive.  Consumers must feature-detect it. */
export interface MembershipActivityCapable {
  addMemberWithActivity(spaceId: string, did: string, key: Uint8Array, opts?: { activityEntry?: Record<string, unknown> }): Promise<{ changed: boolean }>
  removeMemberWithActivity(spaceId: string, did: string, opts?: { activityEntry?: Record<string, unknown> }): Promise<{ changed: boolean }>
}

/** Optional capability: secure self-leave is fully wired, including durable recovery. */
export interface SecureSelfLeaveCapable {
  supportsSecureSelfLeave(): boolean
}

/**
 * Optional capability: open-or-create the private space whose genesis (id +
 * generation-0 keys) is deterministically derived from the identity (Sync 001).
 * Idempotent across devices / recovery / restart — no random-id discovery race.
 */
export interface DeterministicPrivateSpaceCapable {
  openOrCreateDeterministicPrivateSpace<T>(initialDoc: T, meta?: { name?: string; description?: string; appTag?: string; modules?: string[] }): Promise<SpaceInfo>
}

// The runtime guards for these capabilities (hasMembershipActivity,
// hasSecureSelfLeave, hasDeterministicPrivateSpace) live in
// application/spaces/replication-capabilities.ts — ports stay type-only.
