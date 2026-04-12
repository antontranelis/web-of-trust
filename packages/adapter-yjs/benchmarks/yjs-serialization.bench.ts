/**
 * Benchmarks for Yjs document serialization and sync — the CRDT layer.
 *
 * Measures how Y.Doc performance scales with document complexity:
 * - encodeStateAsUpdate (snapshot serialization)
 * - applyUpdate (merging remote state)
 * - encodeStateVector + diff (delta sync)
 * - Doc size growth over time
 *
 * This is the core question Nik Graf's secsync benchmarks answered:
 * at what point does the CRDT layer become the bottleneck?
 */
import * as Y from 'yjs'
import { bench, describe, beforeAll, beforeEach } from 'vitest'

// --- Helpers ---

/** Create a Y.Doc with N simulated changes (contacts in a map) */
function createDocWithChanges(n: number): Y.Doc {
  const doc = new Y.Doc()
  const data = doc.getMap('data')
  const contacts = new Y.Map()
  data.set('contacts', contacts)

  doc.transact(() => {
    for (let i = 0; i < n; i++) {
      const contact = new Y.Map()
      contact.set('name', `Contact ${i}`)
      contact.set('did', `did:key:z6Mk${i.toString(16).padStart(40, '0')}`)
      contact.set('verified', i % 3 === 0)
      contact.set('createdAt', Date.now())
      contacts.set(`c-${i}`, contact)
    }
  })

  return doc
}

/** Create a Y.Doc with N individual transactions (worst case for update log) */
function createDocWithIndividualChanges(n: number): Y.Doc {
  const doc = new Y.Doc()
  const data = doc.getMap('data')
  const contacts = new Y.Map()
  data.set('contacts', contacts)

  for (let i = 0; i < n; i++) {
    doc.transact(() => {
      const contact = new Y.Map()
      contact.set('name', `Contact ${i}`)
      contact.set('did', `did:key:z6Mk${i.toString(16).padStart(40, '0')}`)
      contacts.set(`c-${i}`, contact)
    })
  }

  return doc
}

// --- Pre-built docs for benchmarks ---

const changeCounts = [100, 500, 1_000, 5_000, 10_000] as const

const batchedDocs: Record<number, Y.Doc> = {}
const individualDocs: Record<number, Y.Doc> = {}
const encodedStates: Record<number, Uint8Array> = {}

beforeAll(() => {
  for (const n of changeCounts) {
    batchedDocs[n] = createDocWithChanges(n)
    encodedStates[n] = Y.encodeStateAsUpdate(batchedDocs[n])
  }
  // Individual changes only up to 5k (10k takes too long for setup)
  for (const n of [100, 500, 1_000, 5_000] as const) {
    individualDocs[n] = createDocWithIndividualChanges(n)
  }
})

// --- Doc Size Report (not a bench, but useful context) ---

describe('Y.Doc size report', () => {
  bench('measure doc sizes (printed to console)', () => {
    const report: Record<string, { contacts: number; snapshotBytes: number; snapshotKB: string }> = {}
    for (const n of changeCounts) {
      const bytes = encodedStates[n].byteLength
      report[`${n} contacts`] = {
        contacts: n,
        snapshotBytes: bytes,
        snapshotKB: `${(bytes / 1024).toFixed(1)} KB`,
      }
    }
    console.table(report)
  }, { iterations: 1 })
})

// --- Snapshot Encoding ---

describe('Y.encodeStateAsUpdate (full snapshot)', () => {
  for (const n of changeCounts) {
    bench(`encode ${n} contacts (batched)`, () => {
      Y.encodeStateAsUpdate(batchedDocs[n])
    })
  }
})

describe('Y.encodeStateAsUpdate (individual transactions)', () => {
  for (const n of [100, 500, 1_000, 5_000] as const) {
    bench(`encode ${n} contacts (individual txns)`, () => {
      Y.encodeStateAsUpdate(individualDocs[n])
    })
  }
})

// --- Snapshot Decoding (applyUpdate to empty doc) ---

describe('Y.applyUpdate (load snapshot into empty doc)', () => {
  for (const n of changeCounts) {
    bench(`apply ${n}-contact snapshot`, () => {
      const target = new Y.Doc()
      Y.applyUpdate(target, encodedStates[n])
    })
  }
})

// --- Delta Sync (State Vector → diff → apply) ---

describe('Delta sync (encodeStateVector + encodeStateAsUpdate + applyUpdate)', () => {
  for (const n of changeCounts) {
    bench(`delta sync ${n} contacts (10 new contacts)`, () => {
      // Simulate: remote doc has N contacts, local has N contacts + 10 new
      const local = new Y.Doc()
      Y.applyUpdate(local, encodedStates[n])

      // Add 10 new contacts locally
      const data = local.getMap('data')
      const contacts = data.get('contacts') as Y.Map<any>
      local.transact(() => {
        for (let i = 0; i < 10; i++) {
          const c = new Y.Map()
          c.set('name', `New Contact ${i}`)
          contacts.set(`new-${i}`, c)
        }
      })

      // Now compute and apply delta to a "remote" doc
      const remote = new Y.Doc()
      Y.applyUpdate(remote, encodedStates[n])

      const remoteStateVector = Y.encodeStateVector(remote)
      const delta = Y.encodeStateAsUpdate(local, remoteStateVector)
      Y.applyUpdate(remote, delta)
    })
  }
})

// --- Merge: Two diverged docs ---

describe('Merge diverged docs', () => {
  for (const n of [100, 500, 1_000] as const) {
    bench(`merge 2 docs diverged from ${n} contacts (each +50 contacts)`, () => {
      // Both start from same base
      const base = encodedStates[n]

      const docA = new Y.Doc()
      Y.applyUpdate(docA, base)
      const docB = new Y.Doc()
      Y.applyUpdate(docB, base)

      // Each adds 50 different contacts
      docA.transact(() => {
        const contacts = (docA.getMap('data').get('contacts') as Y.Map<any>)
        for (let i = 0; i < 50; i++) {
          const c = new Y.Map()
          c.set('name', `A-Contact ${i}`)
          contacts.set(`a-${i}`, c)
        }
      })
      docB.transact(() => {
        const contacts = (docB.getMap('data').get('contacts') as Y.Map<any>)
        for (let i = 0; i < 50; i++) {
          const c = new Y.Map()
          c.set('name', `B-Contact ${i}`)
          contacts.set(`b-${i}`, c)
        }
      })

      // Merge: A → B and B → A
      const svA = Y.encodeStateVector(docA)
      const svB = Y.encodeStateVector(docB)
      const deltaAtoB = Y.encodeStateAsUpdate(docA, svB)
      const deltaBtoA = Y.encodeStateAsUpdate(docB, svA)
      Y.applyUpdate(docB, deltaAtoB)
      Y.applyUpdate(docA, deltaBtoA)
    })
  }
})
