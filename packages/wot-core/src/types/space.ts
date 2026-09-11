export type ReplicationState = 'idle' | 'syncing' | 'error'

/**
 * Kennung der Aufnahme in einen Space (RLS-Spec 12 Regel 4): die Generation, ab
 * der die aktuelle, ununterbrochene Mitgliedschaft der eigenen DID im
 * synchronisierten `_members`-Event-Set laeuft (Sync 005) — das erste `active`
 * nach dem letzten `removed`.
 *
 * ABGELEITET, nie gespeichert (`resolveAdmission`, protocol/sync/
 * membership-events). Damit ist sie auf jedem Geraet derselben Identitaet
 * gleich, sobald das Doc gesynct ist, und kann nicht per Last-Writer-Wins in
 * einer Metadata veralten. Sie aendert sich NUR durch ein neues
 * `active`-Ereignis, also durch eine Wiederaufnahme nach `removed`. Eine
 * Schluesselrotation (ein Dritter wird entfernt), eine erneut zugestellte
 * Einladung an ein bereits aktives Mitglied und jeder Metadata-Schreibvorgang
 * beruehren sie nicht. Alt-Spaces ohne Event-Set haben keine Kennung.
 */
export interface SpaceAdmission {
  /** `sinceGeneration` des ersten active-Ereignisses des laufenden Mitgliedschafts-Laufs; beim Creator 0 */
  keyGeneration: number
}

export interface SpaceInfo {
  id: string
  type: 'personal' | 'shared'
  name?: string
  description?: string
  image?: string
  modules?: string[]
  /** App identifier for cross-app space isolation (e.g. 'rls', 'wot-demo') */
  appTag?: string
  members: string[] // DIDs
  /**
   * Creator-DID — read-only Projektion aus dem Space-Doc (`_meta.createdBy`,
   * VE-2). SPEC-APPROX: dient als Admin-Approximation (`knownAdminDids =
   * [createdBy]`), bis der admin-management-Slice die volle Admin-Liste bringt.
   * Optional: Alt-Spaces ohne `createdBy` fallen auf `members[0]` zurück.
   */
  createdBy?: string
  /**
   * Admin-DIDs — read-only Projektion der AKTIVEN Admins aus dem Space-Doc
   * (`_admins` ∩ aktive `_members`, Sync 005 Z.111-130, VE-1/VE-6). Additiv zum
   * Typ wie `members`/`createdBy`. Schreiber sind ausschliesslich `createSpace`
   * (Creator als erster Admin) + `promoteToAdmin`; ein als Member entfernter
   * Admin faellt automatisch aus dieser Liste (`resolveActiveAdmins`).
   * Optional: Alt-Spaces vor diesem Slice haben leeres `_admins` und fallen in
   * `spaceAdminDids` auf `[createdBy ?? members[0]]` zurueck.
   */
  admins?: string[]
  createdAt: string
  /**
   * App-defined metadata (read-only projection of `_meta.appData`). The fixed
   * catalog above (name/image/modules) covers framework fields; apps extend
   * spaces with their own JSON fields here (e.g. RLS accent color) WITHOUT a
   * schema change per field — the closed catalog was exactly how app fields
   * ended up cache-only and vanished on reload (rls#234).
   */
  appData?: Record<string, unknown>
  /**
   * Aufnahme-Kennung dieser Mitgliedschaft (RLS-Spec 12 Regel 4) — read-only
   * Projektion des `_members`-Event-Sets, wie `members` und `admins`. Optional:
   * ohne Ereignisse fuer die eigene DID (Alt-Space, Doc noch nicht gesynct)
   * gibt es keine Kennung.
   */
  admission?: SpaceAdmission
}

export interface SpaceDocMeta {
  name?: string
  description?: string
  image?: string
  modules?: string[]
  /**
   * Shallow PATCH of the app-defined metadata: listed keys are merged over
   * the stored ones, `null` removes a key (JSON Merge Patch, RFC 7386, at
   * depth 1). Values must be JSON-serializable. Adapters MUST store the
   * fields with per-key CRDT granularity (adapter-yjs: flat prefixed keys in
   * `_meta`) so concurrent patches of different keys from two devices merge
   * per key instead of last-writer-wins on a whole container.
   */
  appData?: Record<string, unknown>
}

export interface SpaceMemberChange {
  spaceId: string
  did: string
  action: 'added' | 'removed'
}

/**
 * Decoded incoming space-invite event. The wire payload is an ECIES container
 * (1.B.3-key-rotation), so consumers (e.g. invite dialogs) must not parse
 * MessageEnvelope.payload — adapters emit this event after a verified apply.
 */
export interface IncomingSpaceInvite {
  spaceId: string
  spaceName?: string
  fromDid: string
  /**
   * Per-event unique id of the invite delivery (the verified inbox envelope's
   * outerId). Consumers use it as the stable notification identity — a
   * per-space key would permanently block re-invites of the same space once
   * one invite was resolved. Required so tsc forces every emit site to pass it.
   */
  inviteMessageId: string
  /**
   * Aufnahme-Kennung dieser Einladung (RLS-Spec 12 Regel 4) — identisch zu
   * `SpaceInfo.admission` nach dem Apply, abgeleitet aus dem `_members`-Set des
   * Invite-Snapshots. Optional: ein spec-konformer Invite ohne Snapshot traegt
   * noch keine Ereignisse; die Kennung kommt dann mit dem Doc-Sync nach.
   */
  admission?: SpaceAdmission
}
