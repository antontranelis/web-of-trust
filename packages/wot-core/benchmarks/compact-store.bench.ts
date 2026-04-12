/**
 * Benchmarks for CompactStorageManager — IndexedDB snapshot save/load performance.
 *
 * Measures IDB throughput at various snapshot sizes to understand
 * the storage bottleneck in the persistence pipeline.
 */
import 'fake-indexeddb/auto'
import { bench, describe, beforeAll, afterAll } from 'vitest'
import { CompactStorageManager } from '../src/storage/CompactStorageManager'

let store: CompactStorageManager
const snapshots: Record<string, Uint8Array> = {}

const sizes = {
  '1 KB': 1_024,
  '10 KB': 10_240,
  '100 KB': 102_400,
  '1 MB': 1_048_576,
  '5 MB': 5_242_880,
}

beforeAll(async () => {
  store = new CompactStorageManager('bench-compact-store')
  await store.open()
  for (const [label, size] of Object.entries(sizes)) {
    // Fill in chunks to avoid crypto.getRandomValues 64KB limit
    const buf = new Uint8Array(size)
    const chunk = 65_536
    for (let offset = 0; offset < size; offset += chunk) {
      const len = Math.min(chunk, size - offset)
      crypto.getRandomValues(buf.subarray(offset, offset + len))
    }
    snapshots[label] = buf
  }
})

afterAll(() => {
  store.close()
})

describe('CompactStorageManager.save', () => {
  for (const [label] of Object.entries(sizes)) {
    bench(`save ${label}`, async () => {
      await store.save(`doc-save-${label}`, snapshots[label])
    })
  }
})

describe('CompactStorageManager.load', () => {
  beforeAll(async () => {
    for (const [label] of Object.entries(sizes)) {
      await store.save(`doc-load-${label}`, snapshots[label])
    }
  })

  for (const [label] of Object.entries(sizes)) {
    bench(`load ${label}`, async () => {
      await store.load(`doc-load-${label}`)
    })
  }
})

describe('CompactStorageManager.save+load roundtrip', () => {
  for (const [label] of Object.entries(sizes)) {
    bench(`save+load ${label}`, async () => {
      const docId = `doc-rt-${label}`
      await store.save(docId, snapshots[label])
      await store.load(docId)
    })
  }
})
