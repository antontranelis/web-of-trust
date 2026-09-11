import type { SpaceAdmission } from '../../types/space'

/**
 * Vergleichs- und Ordnungsfunktionen ueber die Aufnahme-Kennung
 * (RLS-Spec 12 Regel 4). Die Kennung selbst wird nirgends gespeichert: sie ist
 * eine Projektion des synchronisierten `_members`-Event-Sets und entsteht
 * ausschliesslich in `resolveAdmission` (protocol/sync/membership-events).
 */

/** True, wenn beide Kennungen dieselbe Aufnahme bezeichnen (beide fehlend gilt als gleich). */
export function isSameAdmission(a: SpaceAdmission | null | undefined, b: SpaceAdmission | null | undefined): boolean {
  if (!a || !b) return !a && !b
  return a.keyGeneration === b.keyGeneration
}

/**
 * Ordnung ueber Aufnahme-Kennungen (aufsteigend nach Generation). Eine
 * Wiederaufnahme liegt stets hinter der vorherigen Aufnahme: die Entfernung
 * rotiert, das neue `active`-Ereignis traegt deshalb eine hoehere Generation.
 */
export function compareAdmission(a: SpaceAdmission, b: SpaceAdmission): number {
  if (a.keyGeneration === b.keyGeneration) return 0
  return a.keyGeneration < b.keyGeneration ? -1 : 1
}
