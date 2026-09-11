import { describe, it, expect } from 'vitest'
import { isSameAdmission, compareAdmission } from '../src/application/spaces/admission'
import { resolveAdmission, resolveActiveMembers } from '../src/protocol/sync/membership-events'
import type { MembershipEvent } from '../src/protocol/sync/membership-events'
import { PersonalDocSpaceMetadataStorage } from '../src/adapters/storage/AutomergeSpaceMetadataStorage'

const DID = 'did:key:zAlice'
const OTHER = 'did:key:zBob'
const active = (sinceGeneration: number, did = DID): MembershipEvent => ({ did, status: 'active', sinceGeneration })
const removed = (sinceGeneration: number, did = DID): MembershipEvent => ({ did, status: 'removed', sinceGeneration })

describe('resolveAdmission (RLS-Spec 12 Regel 4 über das _members-Event-Set)', () => {
  it('nur active@0 → Generation 0', () => {
    expect(resolveAdmission([active(0)], DID)).toEqual({ keyGeneration: 0 })
  })

  it('active@0, removed@1, active@2 (Wiederaufnahme) → Generation 2', () => {
    const events = [active(0), removed(1), active(2)]
    expect(resolveAdmission(events, DID)).toEqual({ keyGeneration: 2 })
    // … und die Kennung steigt gegenüber der ersten Aufnahme.
    expect(compareAdmission(resolveAdmission(events, DID)!, { keyGeneration: 0 })).toBeGreaterThan(0)
  })

  it('active@0, removed@1 (entfernt) → keine Aufnahme', () => {
    expect(resolveAdmission([active(0), removed(1)], DID)).toBeUndefined()
  })

  it('keine Ereignisse für die DID → undefined (Alt-Space / fremde DID)', () => {
    expect(resolveAdmission([], DID)).toBeUndefined()
    expect(resolveAdmission([active(3, OTHER)], DID)).toBeUndefined()
  })

  it('Gewinnerregel: höchste Generation entscheidet über aktiv, bei Gleichstand removed', () => {
    // Reihenfolge im Set ist bedeutungslos (CRDT-Map ohne Ordnung) …
    expect(resolveAdmission([active(2), removed(1)], DID)).toEqual({ keyGeneration: 2 })
    expect(resolveAdmission([removed(1), active(2)], DID)).toEqual({ keyGeneration: 2 })
    // … und zwei active ohne removed dazwischen sind EIN Lauf ab dem ersten.
    expect(resolveAdmission([active(2), active(0)], DID)).toEqual({ keyGeneration: 0 })
    expect(resolveAdmission([active(0), active(2)], DID)).toEqual({ keyGeneration: 0 })
    // Gleichstand → 'removed' gewinnt, also keine Aufnahme (konservativ, wie
    // resolveActiveMembers).
    expect(resolveAdmission([active(1), removed(1)], DID)).toBeUndefined()
    expect(resolveActiveMembers([active(1), removed(1)])).toEqual([])
  })

  it('zweites active für ein durchgehend aktives Mitglied (Re-Invite nach Fremd-Rotation) hebt die Kennung NICHT', () => {
    // addMember schreibt fuer ein bereits aktives Mitglied ein weiteres active
    // auf der inzwischen rotierten Generation. Die Mitgliedschaft endete nie —
    // die Kennung bleibt auf dem Beginn des laufenden Laufs.
    expect(resolveAdmission([active(0), active(1)], DID)).toEqual({ keyGeneration: 0 })
    expect(resolveAdmission([active(0), active(1), active(4)], DID)).toEqual({ keyGeneration: 0 })
    // Nach einem removed schneidet der Lauf: das erste active DANACH zaehlt.
    expect(resolveAdmission([active(0), active(1), removed(2), active(3), active(5)], DID)).toEqual({ keyGeneration: 3 })
  })

  it('eine Rotation ohne neues Ereignis lässt die Kennung stehen', () => {
    // Carol wird bei Generation 1 entfernt (Rotation) — Alices Ereignis bleibt
    // active@0, also bleibt ihre Kennung 0, obwohl die aktuelle Generation 1 ist.
    const events = [active(0), active(0, OTHER), removed(1, 'did:key:zCarol')]
    expect(resolveAdmission(events, DID)).toEqual({ keyGeneration: 0 })
  })
})

describe('isSameAdmission / compareAdmission', () => {
  it('isSameAdmission vergleicht die Generation und toleriert undefined', () => {
    expect(isSameAdmission({ keyGeneration: 1 }, { keyGeneration: 1 })).toBe(true)
    expect(isSameAdmission({ keyGeneration: 1 }, { keyGeneration: 2 })).toBe(false)
    expect(isSameAdmission(undefined, undefined)).toBe(true)
    expect(isSameAdmission(undefined, { keyGeneration: 0 })).toBe(false)
    expect(isSameAdmission({ keyGeneration: 0 }, null)).toBe(false)
  })

  it('compareAdmission ordnet aufsteigend nach Generation', () => {
    expect(compareAdmission({ keyGeneration: 1 }, { keyGeneration: 0 })).toBeGreaterThan(0)
    expect(compareAdmission({ keyGeneration: 0 }, { keyGeneration: 1 })).toBeLessThan(0)
    expect(compareAdmission({ keyGeneration: 2 }, { keyGeneration: 2 })).toBe(0)
  })
})

describe('Persistenz: die Aufnahme-Kennung wird NICHT gespeichert', () => {
  it('PersonalDocSpaceMetadataStorage schreibt kein admission-Feld', async () => {
    let doc: Record<string, Record<string, unknown>> = { spaces: {}, groupKeys: {}, capabilitySigningSeeds: {} }
    const read = () => JSON.parse(JSON.stringify(doc)) as Record<string, Record<string, unknown>>
    const storage = new PersonalDocSpaceMetadataStorage({
      getPersonalDoc: read,
      changePersonalDoc: (change) => { const s = read(); change(s); doc = JSON.parse(JSON.stringify(s)) },
    })
    await storage.saveSpaceMetadata({
      info: {
        id: 'space-1', type: 'shared', members: [DID], createdAt: '2026-01-01T00:00:00.000Z',
        admission: { keyGeneration: 3 },
      },
      documentId: 'space-1',
      documentUrl: 'yjs:space-1',
      memberEncryptionKeys: {},
    })
    // Weder im Dokument …
    expect(JSON.stringify(doc)).not.toContain('admission')
    // … noch beim Lesen: die Kennung kommt ausschliesslich aus dem Event-Set.
    expect((await storage.loadSpaceMetadata('space-1'))!.info.admission).toBeUndefined()
  })
})
