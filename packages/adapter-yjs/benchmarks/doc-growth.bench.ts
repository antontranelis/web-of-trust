/**
 * Document Growth Benchmark — How do Y.Docs scale over time?
 *
 * Simulates realistic usage patterns over weeks/months:
 * - Members join/leave
 * - Contacts are added/edited/removed
 * - Attestations accumulate
 * - Chat messages pile up
 *
 * Measures: snapshot size, serialization time, merge time at each stage.
 * This answers: "when does our current architecture hit a wall?"
 */
import * as Y from 'yjs'
import { bench, describe, beforeAll } from 'vitest'

// --- Simulation helpers ---

/** Simulate one day of activity for a space */
function simulateDay(
  doc: Y.Doc,
  day: number,
  activeMemberCount: number,
  opts: {
    newContactsPerMember?: number
    editsPerMember?: number
    attestationsPerDay?: number
    chatMessagesPerMember?: number
  } = {},
) {
  const {
    newContactsPerMember = 1,
    editsPerMember = 2,
    attestationsPerDay = 3,
    chatMessagesPerMember = 5,
  } = opts

  const data = doc.getMap('data')

  // Contacts module
  let contacts = data.get('contacts') as Y.Map<any> | undefined
  if (!contacts) {
    contacts = new Y.Map()
    data.set('contacts', contacts)
  }

  // New contacts
  doc.transact(() => {
    for (let m = 0; m < activeMemberCount; m++) {
      for (let c = 0; c < newContactsPerMember; c++) {
        const contact = new Y.Map()
        contact.set('name', `D${day}M${m}C${c}`)
        contact.set('did', `did:key:z6Mkd${day}m${m}c${c}`.padEnd(56, '0'))
        contact.set('verified', false)
        contact.set('notes', `Day ${day} contact`)
        contacts!.set(`d${day}-m${m}-c${c}`, contact)
      }
    }
  })

  // Edits to existing contacts (mark as verified, add notes)
  doc.transact(() => {
    const keys = Array.from(contacts!.keys())
    const editCount = Math.min(editsPerMember * activeMemberCount, keys.length)
    for (let i = 0; i < editCount; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)]
      const contact = contacts!.get(key) as Y.Map<any>
      if (contact) {
        contact.set('verified', true)
        contact.set('notes', `Updated on day ${day}`)
      }
    }
  })

  // Attestations
  let attestations = data.get('attestations') as Y.Map<any> | undefined
  if (!attestations) {
    attestations = new Y.Map()
    data.set('attestations', attestations)
  }

  doc.transact(() => {
    for (let a = 0; a < attestationsPerDay; a++) {
      const att = new Y.Map()
      att.set('from', `did:key:z6MkDay${day}Att${a}`.padEnd(56, '0'))
      att.set('to', `did:key:z6MkDay${day}To${a}`.padEnd(56, '0'))
      att.set('claim', `trust-${a}`)
      att.set('sig', `sig-d${day}-a${a}`.padEnd(64, '0'))
      att.set('ts', Date.now())
      attestations!.set(`att-d${day}-${a}`, att)
    }
  })

  // Chat messages (if module active)
  let chat = data.get('chat') as Y.Array<any> | undefined
  if (!chat) {
    chat = new Y.Array()
    data.set('chat', chat)
  }

  doc.transact(() => {
    for (let m = 0; m < activeMemberCount; m++) {
      for (let msg = 0; msg < chatMessagesPerMember; msg++) {
        const message = new Y.Map()
        message.set('from', `did:key:z6MkM${m}`.padEnd(56, '0'))
        message.set('text', `Message from member ${m} on day ${day}, msg ${msg}. This is a typical chat message with some content.`)
        message.set('ts', Date.now() + msg * 1000)
        chat!.push([message])
      }
    }
  })
}

// --- Growth stages ---

interface GrowthStage {
  label: string
  days: number
  activeMembers: number
  opts?: Parameters<typeof simulateDay>[3]
}

const stages: GrowthStage[] = [
  { label: '1 week (5 members)', days: 7, activeMembers: 5 },
  { label: '1 month (10 members)', days: 30, activeMembers: 10 },
  { label: '3 months (15 members)', days: 90, activeMembers: 15 },
  { label: '6 months (20 members)', days: 180, activeMembers: 20 },
  { label: '1 year (25 members)', days: 365, activeMembers: 25 },
]

const docs: Record<string, Y.Doc> = {}
const snapshots: Record<string, Uint8Array> = {}

beforeAll(() => {
  // Build docs incrementally (each stage continues from the previous)
  let currentDoc = new Y.Doc()
  let totalDays = 0

  for (const stage of stages) {
    const daysToSimulate = stage.days - totalDays
    for (let d = 0; d < daysToSimulate; d++) {
      simulateDay(currentDoc, totalDays + d, stage.activeMembers, stage.opts)
    }
    totalDays = stage.days

    // Clone the doc at this stage
    const snapshot = Y.encodeStateAsUpdate(currentDoc)
    const cloned = new Y.Doc()
    Y.applyUpdate(cloned, snapshot)

    docs[stage.label] = cloned
    snapshots[stage.label] = snapshot
  }

  // Report sizes
  const report: Record<string, {
    days: number
    snapshotKB: string
    snapshotMB: string
    contacts: number
    attestations: number
    chatMessages: number
  }> = {}

  for (const stage of stages) {
    const doc = docs[stage.label]
    const data = doc.getMap('data')
    const contactCount = (data.get('contacts') as Y.Map<any>)?.size ?? 0
    const attestCount = (data.get('attestations') as Y.Map<any>)?.size ?? 0
    const chatCount = (data.get('chat') as Y.Array<any>)?.length ?? 0
    const bytes = snapshots[stage.label].byteLength

    report[stage.label] = {
      days: stage.days,
      snapshotKB: `${(bytes / 1024).toFixed(1)} KB`,
      snapshotMB: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
      contacts: contactCount,
      attestations: attestCount,
      chatMessages: chatCount,
    }
  }

  console.log('\n=== Document Growth Report ===')
  console.table(report)
})

// --- Benchmark: Snapshot encoding at each growth stage ---

describe('Growth: Y.encodeStateAsUpdate at each stage', () => {
  for (const stage of stages) {
    bench(`encode ${stage.label}`, () => {
      Y.encodeStateAsUpdate(docs[stage.label])
    })
  }
})

// --- Benchmark: Loading from snapshot at each stage ---

describe('Growth: Load from snapshot (applyUpdate to empty doc)', () => {
  for (const stage of stages) {
    bench(`load ${stage.label}`, () => {
      const fresh = new Y.Doc()
      Y.applyUpdate(fresh, snapshots[stage.label])
    })
  }
})

// --- Benchmark: Applying a small delta to a large doc ---

describe('Growth: Apply 5 new contacts to doc at each stage', () => {
  for (const stage of stages) {
    bench(`delta on ${stage.label}`, () => {
      // Clone doc
      const doc = new Y.Doc()
      Y.applyUpdate(doc, snapshots[stage.label])

      // Create a small delta from another peer
      const peer = new Y.Doc()
      Y.applyUpdate(peer, snapshots[stage.label])
      const svBefore = Y.encodeStateVector(peer)

      peer.transact(() => {
        const contacts = (peer.getMap('data').get('contacts') as Y.Map<any>)
        for (let i = 0; i < 5; i++) {
          const c = new Y.Map()
          c.set('name', `DeltaTest-${i}`)
          contacts.set(`delta-test-${i}`, c)
        }
      })

      const delta = Y.encodeStateAsUpdate(peer, svBefore)
      Y.applyUpdate(doc, delta, 'remote')
    })
  }
})
