/**
 * Doc-internes Membership-Event-Set fuer die kanonische Mitgliederliste (Sync 005).
 *
 * Sync 005 Z.163: "Empfaenger MUESSEN `member-update` gegen den naechsten Space-Sync
 * verifizieren. Die kanonische Mitgliederliste bleibt das signierte und synchronisierte
 * Space-Dokument. `member-update` allein DARF keine dauerhafte Membership-State-Aenderung
 * erzwingen."
 *
 * Die Liste lebt als grow-only Event-Set im synchronisierten Space-Dokument: Eintraege
 * werden ausschliesslich hinzugefuegt, nie ueberschrieben oder geloescht. Konkurrierende
 * Schreiber treffen verschiedene Keys (`${did}:${generation}:${status}`), die CRDT-Merge-
 * Semantik kann strukturell nichts verlieren; derselbe Key zweimal geschrieben traegt
 * denselben semantischen Inhalt (idempotent). Die spec-sichtbare Form bleibt die
 * `members: string[]`-Projektion (Sync 005 Z.109-130) via `resolveActiveMembers`.
 */

import type { SpaceAdmission } from '../../types/space'

export type MembershipStatus = 'active' | 'removed'

export interface MembershipEvent {
  did: string
  status: MembershipStatus
  /** Key-Generation, ab der dieser Status gilt */
  sinceGeneration: number
  /** informativ, KEIN Autoritaetstraeger */
  addedBy?: string
}

/** Die DID-Anteile des Event-Keys; `addedBy` reist nur im Event-Value, nie im Key. */
export type MembershipEventKeyParts = Pick<MembershipEvent, 'did' | 'sinceGeneration' | 'status'>

const DID_PATTERN = /^did:[a-z0-9]+:.+/
// Kanonische Dezimalform ohne fuehrende Nullen — Key-Identitaet muss eindeutig sein.
const CANONICAL_GENERATION_PATTERN = /^(0|[1-9][0-9]*)$/

/**
 * Formatiert den Event-Key `${did}:${generation}:${status}`.
 * DIDs enthalten selbst ":" — der Codec bleibt eindeutig, weil Generation und Status
 * als festes SUFFIX (letzte zwei Segmente) angehaengt und geparst werden.
 */
export function formatMembershipEventKey(parts: MembershipEventKeyParts): string {
  assertMembershipDid(parts.did, 'membership-event did')
  assertNonNegativeSafeInteger(parts.sinceGeneration, 'membership-event sinceGeneration')
  assertMembershipStatus(parts.status)
  return `${parts.did}:${parts.sinceGeneration}:${parts.status}`
}

/**
 * Parst den Event-Key robust ueber das SUFFIX: letztes Segment = Status,
 * vorletztes Segment = Generation, der Rest (inkl. aller ":") ist die DID.
 */
export function parseMembershipEventKey(key: string): MembershipEventKeyParts {
  if (typeof key !== 'string') throw new Error('Invalid membership-event key')
  const lastSeparator = key.lastIndexOf(':')
  if (lastSeparator === -1) throw new Error('Invalid membership-event key')
  const secondLastSeparator = key.lastIndexOf(':', lastSeparator - 1)
  if (secondLastSeparator === -1) throw new Error('Invalid membership-event key')

  const did = key.slice(0, secondLastSeparator)
  const generationSegment = key.slice(secondLastSeparator + 1, lastSeparator)
  const statusSegment = key.slice(lastSeparator + 1)

  assertMembershipDid(did, 'membership-event key did')
  if (!CANONICAL_GENERATION_PATTERN.test(generationSegment)) {
    throw new Error('Invalid membership-event key generation')
  }
  assertMembershipStatus(statusSegment)

  // Number() verliert oberhalb von MAX_SAFE_INTEGER Praezision — die geparste
  // Generation muss dieselbe Safe-Integer-Grenze einhalten wie der Formatter.
  const sinceGeneration = Number(generationSegment)
  assertNonNegativeSafeInteger(sinceGeneration, 'membership-event key generation')

  return { did, sinceGeneration, status: statusSegment }
}

/**
 * Lese-Regel der kanonischen Mitgliederliste: pro DID gewinnt das Event mit der
 * hoechsten `sinceGeneration` (Sync 005 Z.305: "Wenn Einladung und Entfernung
 * konkurrieren, gewinnt die hoehere Key-Generation."). Aktiv ⇔ Gewinner-Event hat
 * `status: 'active'`.
 *
 * Rueckgabe ist die spec-sichtbare `members: string[]`-Projektion (Sync 005 Z.109-130),
 * lexikographisch sortiert — das Event-Set traegt keine Ordnung (CRDT-Map-Keys),
 * die Projektion muss auf allen Peers deterministisch identisch sein.
 */
export function resolveActiveMembers(events: Iterable<MembershipEvent>): string[] {
  const winners = new Map<string, MembershipEvent>()
  for (const event of events) {
    const incumbent = winners.get(event.did)
    if (incumbent === undefined || membershipEventWins(event, incumbent)) {
      winners.set(event.did, event)
    }
  }
  const active: string[] = []
  for (const winner of winners.values()) {
    if (winner.status === 'active') active.push(winner.did)
  }
  return active.sort()
}

/**
 * Gewinner-Event fuer EINE DID nach derselben Lese-Regel wie `resolveActiveMembers`
 * (hoechste `sinceGeneration`, Tie-Break removed). `undefined`, wenn das Event-Set
 * keine Events fuer die DID traegt. Grundlage der Review-M1-Pruefung, ob das
 * Event-Set die Antwort auf ein Pending-member-update bereits enthaelt
 * (`canonicalEventSetAnswersPending`).
 */
export function resolveMembershipWinner(events: Iterable<MembershipEvent>, did: string): MembershipEvent | undefined {
  let winner: MembershipEvent | undefined
  for (const event of events) {
    if (event.did !== did) continue
    if (winner === undefined || membershipEventWins(event, winner)) {
      winner = event
    }
  }
  return winner
}

/**
 * Aufnahme-Kennung EINER DID (RLS-Spec 12 Regel 4): die Generation, AB DER die
 * aktuelle, ununterbrochene Mitgliedschaft laeuft — die niedrigste
 * `active`-Generation nach der letzten `removed`-Generation dieser DID.
 *
 * Aktiv-Sein entscheidet dieselbe Gewinnerregel wie `resolveActiveMembers`:
 * ist der Gewinner `removed` (oder gibt es kein Ereignis), gibt es keine
 * Aufnahme — `undefined`.
 *
 * Warum nicht einfach die Generation des Gewinner-Ereignisses: `addMember`
 * schreibt fuer ein BEREITS aktives Mitglied ein weiteres `active` auf der
 * dann aktuellen Generation (etwa wenn zwischenzeitlich wegen der Entfernung
 * eines Dritten rotiert wurde und die Einladung erneut zugestellt wird). Die
 * Mitgliedschaft endete dabei nie, also darf die Kennung nicht steigen — sonst
 * sieht ein Geraet eine Wiederaufnahme, die nie stattfand. Erst ein `removed`
 * schneidet den Lauf: das naechste `active` danach ist die neue Aufnahme.
 *
 * Rotation (ein Dritter wird entfernt), erneute Zustellung derselben Einladung
 * und jeder Metadata-Schreibvorgang lassen die Kennung damit unveraendert.
 */
export function resolveAdmission(events: Iterable<MembershipEvent>, did: string): SpaceAdmission | undefined {
  // Einmal materialisieren: ein Iterable darf ein Einweg-Iterator sein, unten
  // wird mehrfach gelesen.
  const own: MembershipEvent[] = []
  for (const event of events) {
    if (event.did === did) own.push(event)
  }
  const winner = resolveMembershipWinner(own, did)
  if (winner === undefined || winner.status !== 'active') return undefined

  let lastRemoved = -1
  for (const event of own) {
    if (event.status === 'removed' && event.sinceGeneration > lastRemoved) lastRemoved = event.sinceGeneration
  }
  let admitted = winner.sinceGeneration
  for (const event of own) {
    if (event.status === 'active' && event.sinceGeneration > lastRemoved && event.sinceGeneration < admitted) {
      admitted = event.sinceGeneration
    }
  }
  return { keyGeneration: admitted }
}

// Bei Generation-Gleichstand gewinnt 'removed': konservativer Tie-Break, ein entfernter
// Member bleibt draussen — die Spec definiert den Gleichstand nicht. Der Re-Invite-Pfad
// muss deshalb VOR dem erneuten addMember rotieren (Re-Invite-Guard, sicherheitlich
// ohnehin geboten: der zuvor Entfernte kennt die alten Keys).
// SPEC-UNKLAR: Doc-interne Listen-Form vs. Z.305, Issue folgt im PR
function membershipEventWins(candidate: MembershipEvent, incumbent: MembershipEvent): boolean {
  if (candidate.sinceGeneration !== incumbent.sinceGeneration) {
    return candidate.sinceGeneration > incumbent.sinceGeneration
  }
  return candidate.status === 'removed' && incumbent.status === 'active'
}

export function assertMembershipEvent(value: unknown): asserts value is MembershipEvent {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid membership-event')
  }
  const event = value as Record<string, unknown>
  const allowed = new Set(['did', 'status', 'sinceGeneration', 'addedBy'])
  for (const key of Object.keys(event)) {
    if (!allowed.has(key)) throw new Error(`Invalid membership-event property: ${key}`)
  }
  assertMembershipDid(event.did, 'membership-event did')
  assertMembershipStatus(event.status)
  assertNonNegativeSafeInteger(event.sinceGeneration, 'membership-event sinceGeneration')
  if (event.addedBy !== undefined) assertMembershipDid(event.addedBy, 'membership-event addedBy')
}

function assertMembershipStatus(value: unknown): asserts value is MembershipStatus {
  if (value !== 'active' && value !== 'removed') throw new Error('Invalid membership-event status')
}

function assertMembershipDid(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !DID_PATTERN.test(value)) throw new Error(`Invalid ${name}`)
}

// Safe-Integer-Grenze wie im uebrigen Sync-Protocol-Code (z.B. sync-messages,
// seq-consistency): remote _members-Werte und geparste Key-Generationen duerfen
// nicht mit Praezisionsverlust in die Resolution laufen.
function assertNonNegativeSafeInteger(value: unknown, name: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error(`Invalid ${name}`)
}
