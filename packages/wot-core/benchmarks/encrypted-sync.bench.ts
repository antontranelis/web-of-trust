/**
 * Benchmarks for EncryptedSyncService — AES-256-GCM encrypt/decrypt performance.
 *
 * Measures throughput at various payload sizes to understand the crypto cost
 * in our sync pipeline. Inspired by secsync benchmarks (secsync.com/docs/benchmarks).
 */
import { bench, describe, beforeAll } from 'vitest'
import { EncryptedSyncService } from '../src/services/EncryptedSyncService'

const SPACE_ID = 'bench-space-00000000-0000-0000-0000-000000000000'
const FROM_DID = 'did:key:z6MkBenchmark000000000000000000000000000000'
let groupKey: Uint8Array

/** Fill a Uint8Array with pseudo-random data (avoids crypto.getRandomValues 64KB limit) */
function fillRandom(size: number): Uint8Array {
  const buf = new Uint8Array(size)
  const chunk = 65_536
  for (let offset = 0; offset < size; offset += chunk) {
    const len = Math.min(chunk, size - offset)
    crypto.getRandomValues(buf.subarray(offset, offset + len))
  }
  return buf
}

// Payloads of different sizes (simulating CRDT updates of varying doc complexity)
const payloads: Record<string, Uint8Array> = {}
const sizes = {
  '1 KB': 1_024,
  '10 KB': 10_240,
  '100 KB': 102_400,
  '1 MB': 1_048_576,
  '5 MB': 5_242_880,
}

beforeAll(() => {
  groupKey = crypto.getRandomValues(new Uint8Array(32))
  for (const [label, size] of Object.entries(sizes)) {
    payloads[label] = fillRandom(size)
  }
})

describe('EncryptedSyncService.encryptChange', () => {
  for (const [label] of Object.entries(sizes)) {
    bench(`encrypt ${label}`, async () => {
      await EncryptedSyncService.encryptChange(
        payloads[label],
        groupKey,
        SPACE_ID,
        0,
        FROM_DID,
      )
    })
  }
})

describe('EncryptedSyncService.decryptChange', () => {
  const encrypted: Record<string, Awaited<ReturnType<typeof EncryptedSyncService.encryptChange>>> = {}

  beforeAll(async () => {
    for (const [label] of Object.entries(sizes)) {
      encrypted[label] = await EncryptedSyncService.encryptChange(
        payloads[label],
        groupKey,
        SPACE_ID,
        0,
        FROM_DID,
      )
    }
  })

  for (const [label] of Object.entries(sizes)) {
    bench(`decrypt ${label}`, async () => {
      await EncryptedSyncService.decryptChange(encrypted[label], groupKey)
    })
  }
})

describe('EncryptedSyncService.roundtrip (encrypt + decrypt)', () => {
  for (const [label] of Object.entries(sizes)) {
    bench(`roundtrip ${label}`, async () => {
      const enc = await EncryptedSyncService.encryptChange(
        payloads[label],
        groupKey,
        SPACE_ID,
        0,
        FROM_DID,
      )
      await EncryptedSyncService.decryptChange(enc, groupKey)
    })
  }
})
