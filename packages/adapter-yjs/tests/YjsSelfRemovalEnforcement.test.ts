import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { PublicIdentitySession } from '../../wot-core/src/application/identity'
import { createTestIdentity } from '../../wot-core/tests/helpers/identity-session'
import {
  InMemoryMessagingAdapter,
  InProcessLogBroker,
  InMemorySpaceMetadataStorage,
  InMemoryCompactStore,
  InMemoryKeyManagementAdapter,
  InMemoryDocLogStore,
} from '@web_of_trust/core/adapters'
import { YjsReplicationAdapter } from '../src/YjsReplicationAdapter'
import { initYjsPersonalDoc, resetYjsPersonalDoc } from '../src/YjsPersonalDocManager'

// Sync 005 §Self-Leave (#298): der austretende Member schreibt sein removed, die
// angekuendigte Rotation zieht ein beobachtender Admin nach. Faellt der Admin im
// Fenster zwischen persistierter Beobachtung und Staging aus, triggert der
// _members-Observer nie wieder (das Event-Set aendert sich nicht mehr) und die
// VE-C3-Recovery findet kein Pending — nur der Restore-Hook kann es noch nachziehen.

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))

/** Deterministisch statt fester Sleeps: CI-Runner sind deutlich langsamer als Dev-Maschinen. */
async function waitUntil(condition: () => boolean | Promise<boolean>, what: string, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await condition()) return
    await new Promise((r) => setTimeout(r, 10))
  }
  throw new Error(`Timed out waiting for ${what}`)
}
const BROKER_URLS = ['wss://broker.example.com']
const DEVICE_ALICE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const DEVICE_BOB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

interface TestDoc { items: Record<string, { title: string }> }

interface DurableStores {
  docLogStore: InMemoryDocLogStore
  keyManagement: InMemoryKeyManagementAdapter
  metadataStorage: InMemorySpaceMetadataStorage
  compactStore: InMemoryCompactStore
}

function brokerGeneration(broker: InProcessLogBroker, docId: string): number | undefined {
  return (broker as unknown as { docs: Map<string, { generation: number }> }).docs.get(docId)?.generation
}

function adapterGeneration(adapter: YjsReplicationAdapter, spaceId: string): Promise<number> {
  return (adapter as unknown as { keyManagement: InMemoryKeyManagementAdapter }).keyManagement.getCurrentGeneration(spaceId)
}

function spaceState(adapter: YjsReplicationAdapter, spaceId: string): unknown {
  return (adapter as unknown as { spaces: Map<string, unknown> }).spaces.get(spaceId)
}

/** Membership-Ereignisse im Doc des geladenen Space. */
function membershipEventsOf(adapter: YjsReplicationAdapter, spaceId: string): { did: string; status: string }[] {
  const internals = adapter as unknown as {
    spaces: Map<string, { doc: { getMap(name: string): { values(): Iterable<{ did: string; status: string }> } } }>
  }
  const state = internals.spaces.get(spaceId)
  if (!state) return []
  return Array.from(state.doc.getMap('_members').values())
}

function loadedMembers(adapter: YjsReplicationAdapter, spaceId: string): string[] {
  return (adapter as unknown as { spaces: Map<string, { info: { members: string[] } }> }).spaces.get(spaceId)!.info.members
}

/** Simuliert das Crash-Fenster: die Beobachtung wird persistiert, das Enforcement lief nie. */
function suppressEnforcement(adapter: YjsReplicationAdapter): void {
  ;(adapter as unknown as { enforceCanonicalSelfRemovalRotation: () => Promise<void> })
    .enforceCanonicalSelfRemovalRotation = async () => {}
}

async function makeStores(deviceId: string): Promise<DurableStores> {
  const docLogStore = new InMemoryDocLogStore()
  await docLogStore.init()
  await docLogStore.setDeviceId(deviceId)
  return {
    docLogStore,
    keyManagement: new InMemoryKeyManagementAdapter(),
    metadataStorage: new InMemorySpaceMetadataStorage(),
    compactStore: new InMemoryCompactStore(),
  }
}

describe('Yjs Self-Removal-Enforcement (#298) — Restore zieht eine ausgefallene Rotation nach', () => {
  let alice: PublicIdentitySession, bob: PublicIdentitySession
  let broker: InProcessLogBroker
  let aliceMessaging: InMemoryMessagingAdapter, bobMessaging: InMemoryMessagingAdapter
  let aliceStores: DurableStores
  const started: YjsReplicationAdapter[] = []

  function makeAdapter(identity: PublicIdentitySession, messaging: InMemoryMessagingAdapter, deviceId: string, stores: DurableStores): YjsReplicationAdapter {
    const adapter = new YjsReplicationAdapter({
      identity,
      messaging,
      brokerUrls: BROKER_URLS,
      keyManagement: stores.keyManagement,
      metadataStorage: stores.metadataStorage,
      compactStore: stores.compactStore,
      docLogStore: stores.docLogStore,
      enableLogSync: true,
      deviceId,
      flushPersonalDoc: async () => {},
    })
    started.push(adapter)
    return adapter
  }

  beforeEach(async () => {
    InMemoryMessagingAdapter.resetAll()
    broker = new InProcessLogBroker()
    alice = (await createTestIdentity('sr-enforce-alice')).identity
    bob = (await createTestIdentity('sr-enforce-bob')).identity
    aliceMessaging = new InMemoryMessagingAdapter({ broker, socketId: 'alice-socket' })
    bobMessaging = new InMemoryMessagingAdapter({ broker, socketId: 'bob-socket' })
    await aliceMessaging.connect(alice.getDid())
    await bobMessaging.connect(bob.getDid())
    aliceStores = await makeStores(DEVICE_ALICE)
  })

  afterEach(async () => {
    for (const adapter of started.splice(0)) { try { await adapter.stop() } catch {} }
    await resetYjsPersonalDoc()
    InMemoryMessagingAdapter.resetAll()
    for (const id of [alice, bob]) { try { await id.deleteStoredIdentity() } catch {} }
  })

  it('Crash vor dem Staging: der Restore stößt das Enforcement nach', async () => {
    const aliceAdapter = makeAdapter(alice, aliceMessaging, DEVICE_ALICE, aliceStores)
    const bobAdapter = makeAdapter(bob, bobMessaging, DEVICE_BOB, await makeStores(DEVICE_BOB))
    await aliceAdapter.start()
    await bobAdapter.start()
    // leaveSpace macht die eigene Entfernung im PersonalDoc durabel.
    await initYjsPersonalDoc(bob)

    const space = await aliceAdapter.createSpace<TestDoc>('shared', { items: {} }, { name: 'S' })
    await wait()
    await aliceAdapter.addMember(space.id, bob.getDid(), await bob.getEncryptionPublicKeyBytes())
    await waitUntil(async () => (await bobAdapter.getSpace(space.id)) !== null, 'Bob hat den Space')
    expect(brokerGeneration(broker, space.id)).toBe(0)

    // Crash-Fenster: Alice beobachtet das removed (Doc + Metadata persistiert),
    // das Enforcement läuft aber nie und stagt nichts.
    suppressEnforcement(aliceAdapter)
    await bobAdapter.leaveSpace(space.id)
    await waitUntil(
      () => membershipEventsOf(aliceAdapter, space.id).some((event) => event.did === bob.getDid() && event.status === 'removed'),
      'Bobs removed-Ereignis in Alices _members',
    )
    expect(loadedMembers(aliceAdapter, space.id)).not.toContain(bob.getDid())
    expect(brokerGeneration(broker, space.id)).toBe(0)
    expect(await aliceStores.docLogStore.getPendingRemoval(space.id, bob.getDid())).toBeNull()
    // Den CompactStore-Save ERZWINGEN statt auf die Entprellung zu warten: genau
    // dieser Stand (Doc MIT dem removed) ist die Lücke — beim Restore liegt das
    // Ereignis bereits im Doc, der Observer feuert also nie wieder.
    await (aliceAdapter as unknown as { _saveToCompactStore(state: unknown): Promise<void> })
      ._saveToCompactStore(spaceState(aliceAdapter, space.id))
    await aliceAdapter.stop()

    // Neustart auf DENSELBEN Stores: das Event-Set ändert sich nicht mehr, der
    // Observer triggert also nie wieder — nur der Restore-Hook kann die
    // angekündigte Rotation noch nachziehen.
    const restarted = makeAdapter(alice, new InMemoryMessagingAdapter({ broker, socketId: 'alice-socket-2' }), DEVICE_ALICE, aliceStores)
    await (restarted as unknown as { messaging: InMemoryMessagingAdapter }).messaging.connect(alice.getDid())
    await restarted.start()
    await waitUntil(
      async () => (brokerGeneration(broker, space.id) ?? 0) > 0
        && (await aliceStores.docLogStore.getPendingRemoval(space.id, bob.getDid())) === null,
      'die nachgezogene Rotation am Broker samt abgeschlossenem Staging',
    )

    expect(brokerGeneration(broker, space.id)!).toBeGreaterThan(0)
    expect(await adapterGeneration(restarted, space.id)).toBeGreaterThan(0)
    expect(await aliceStores.docLogStore.getPendingRemoval(space.id, bob.getDid())).toBeNull()
  }, 30_000)
})
