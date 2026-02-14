import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OfflineFirstDiscoveryAdapter } from '../src/adapters/discovery/OfflineFirstDiscoveryAdapter'
import { InMemoryDiscoverySyncStore } from '../src/adapters/discovery/InMemoryDiscoverySyncStore'
import type { DiscoveryAdapter, PublicVerificationsData, PublicAttestationsData } from '../src/adapters/interfaces/DiscoveryAdapter'
import type { PublicProfile } from '../src/types/identity'
import type { WotIdentity } from '../src/identity/WotIdentity'

const ALICE_DID = 'did:key:z6MkAlice1234567890abcdefghijklmnopqrstuvwxyz'

const TEST_PROFILE: PublicProfile = {
  did: ALICE_DID,
  name: 'Alice',
  updatedAt: new Date().toISOString(),
}

const TEST_VERIFICATIONS: PublicVerificationsData = {
  did: ALICE_DID,
  verifications: [],
  updatedAt: new Date().toISOString(),
}

const TEST_ATTESTATIONS: PublicAttestationsData = {
  did: ALICE_DID,
  attestations: [],
  updatedAt: new Date().toISOString(),
}

const MOCK_IDENTITY = {} as WotIdentity

function createMockInner(overrides: Partial<DiscoveryAdapter> = {}): DiscoveryAdapter {
  return {
    publishProfile: vi.fn().mockResolvedValue(undefined),
    publishVerifications: vi.fn().mockResolvedValue(undefined),
    publishAttestations: vi.fn().mockResolvedValue(undefined),
    resolveProfile: vi.fn().mockResolvedValue(null),
    resolveVerifications: vi.fn().mockResolvedValue([]),
    resolveAttestations: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe('OfflineFirstDiscoveryAdapter', () => {
  let inner: DiscoveryAdapter
  let syncStore: InMemoryDiscoverySyncStore
  let adapter: OfflineFirstDiscoveryAdapter

  beforeEach(() => {
    inner = createMockInner()
    syncStore = new InMemoryDiscoverySyncStore()
    adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)
  })

  describe('publishProfile', () => {
    it('should mark dirty and clear on success', async () => {
      await adapter.publishProfile(TEST_PROFILE, MOCK_IDENTITY)

      expect(inner.publishProfile).toHaveBeenCalledWith(TEST_PROFILE, MOCK_IDENTITY)
      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.size).toBe(0)
    })

    it('should keep dirty flag on failure', async () => {
      inner = createMockInner({
        publishProfile: vi.fn().mockRejectedValue(new Error('Network error')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      await adapter.publishProfile(TEST_PROFILE, MOCK_IDENTITY)

      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.has('profile')).toBe(true)
    })
  })

  describe('publishVerifications', () => {
    it('should mark dirty and clear on success', async () => {
      await adapter.publishVerifications(TEST_VERIFICATIONS, MOCK_IDENTITY)

      expect(inner.publishVerifications).toHaveBeenCalledWith(TEST_VERIFICATIONS, MOCK_IDENTITY)
      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.size).toBe(0)
    })

    it('should keep dirty flag on failure', async () => {
      inner = createMockInner({
        publishVerifications: vi.fn().mockRejectedValue(new Error('Network error')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      await adapter.publishVerifications(TEST_VERIFICATIONS, MOCK_IDENTITY)

      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.has('verifications')).toBe(true)
    })
  })

  describe('publishAttestations', () => {
    it('should mark dirty and clear on success', async () => {
      await adapter.publishAttestations(TEST_ATTESTATIONS, MOCK_IDENTITY)

      expect(inner.publishAttestations).toHaveBeenCalledWith(TEST_ATTESTATIONS, MOCK_IDENTITY)
      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.size).toBe(0)
    })

    it('should keep dirty flag on failure', async () => {
      inner = createMockInner({
        publishAttestations: vi.fn().mockRejectedValue(new Error('Network error')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      await adapter.publishAttestations(TEST_ATTESTATIONS, MOCK_IDENTITY)

      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.has('attestations')).toBe(true)
    })
  })

  describe('resolveProfile', () => {
    it('should cache profile on successful resolve', async () => {
      inner = createMockInner({
        resolveProfile: vi.fn().mockResolvedValue(TEST_PROFILE),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const result = await adapter.resolveProfile(ALICE_DID)

      expect(result).toEqual(TEST_PROFILE)
      const cached = await syncStore.getCachedProfile(ALICE_DID)
      expect(cached).toEqual(TEST_PROFILE)
    })

    it('should return cached profile when inner fails', async () => {
      // Pre-populate cache
      await syncStore.cacheProfile(ALICE_DID, TEST_PROFILE)

      inner = createMockInner({
        resolveProfile: vi.fn().mockRejectedValue(new Error('Offline')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const result = await adapter.resolveProfile(ALICE_DID)

      expect(result).toEqual(TEST_PROFILE)
    })

    it('should re-throw when inner fails and no cache exists', async () => {
      inner = createMockInner({
        resolveProfile: vi.fn().mockRejectedValue(new Error('Offline')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      await expect(adapter.resolveProfile(ALICE_DID)).rejects.toThrow('Offline')
    })

    it('should not cache when inner returns null', async () => {
      inner = createMockInner({
        resolveProfile: vi.fn().mockResolvedValue(null),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      await adapter.resolveProfile(ALICE_DID)

      const cached = await syncStore.getCachedProfile(ALICE_DID)
      expect(cached).toBeNull()
    })
  })

  describe('resolveVerifications', () => {
    it('should return verifications from inner on success', async () => {
      const verifications = [{ id: 'v1' }] as any
      inner = createMockInner({
        resolveVerifications: vi.fn().mockResolvedValue(verifications),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const result = await adapter.resolveVerifications(ALICE_DID)

      expect(result).toEqual(verifications)
    })

    it('should return empty array when inner fails', async () => {
      inner = createMockInner({
        resolveVerifications: vi.fn().mockRejectedValue(new Error('Offline')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const result = await adapter.resolveVerifications(ALICE_DID)

      expect(result).toEqual([])
    })
  })

  describe('resolveAttestations', () => {
    it('should return attestations from inner on success', async () => {
      const attestations = [{ id: 'a1' }] as any
      inner = createMockInner({
        resolveAttestations: vi.fn().mockResolvedValue(attestations),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const result = await adapter.resolveAttestations(ALICE_DID)

      expect(result).toEqual(attestations)
    })

    it('should return empty array when inner fails', async () => {
      inner = createMockInner({
        resolveAttestations: vi.fn().mockRejectedValue(new Error('Offline')),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const result = await adapter.resolveAttestations(ALICE_DID)

      expect(result).toEqual([])
    })
  })

  describe('syncPending', () => {
    it('should do nothing when no dirty fields', async () => {
      const getPublishData = vi.fn()

      await adapter.syncPending(ALICE_DID, MOCK_IDENTITY, getPublishData)

      expect(getPublishData).not.toHaveBeenCalled()
      expect(inner.publishProfile).not.toHaveBeenCalled()
    })

    it('should retry all dirty fields', async () => {
      // Simulate failed publishes
      const failingInner = createMockInner({
        publishProfile: vi.fn().mockRejectedValue(new Error('Offline')),
        publishVerifications: vi.fn().mockRejectedValue(new Error('Offline')),
        publishAttestations: vi.fn().mockRejectedValue(new Error('Offline')),
      })
      const failingAdapter = new OfflineFirstDiscoveryAdapter(failingInner, syncStore)

      await failingAdapter.publishProfile(TEST_PROFILE, MOCK_IDENTITY)
      await failingAdapter.publishVerifications(TEST_VERIFICATIONS, MOCK_IDENTITY)
      await failingAdapter.publishAttestations(TEST_ATTESTATIONS, MOCK_IDENTITY)

      // Verify all three are dirty
      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.size).toBe(3)

      // Now retry with a working inner adapter
      const getPublishData = vi.fn().mockResolvedValue({
        profile: TEST_PROFILE,
        verifications: TEST_VERIFICATIONS,
        attestations: TEST_ATTESTATIONS,
      })

      await adapter.syncPending(ALICE_DID, MOCK_IDENTITY, getPublishData)

      expect(inner.publishProfile).toHaveBeenCalledWith(TEST_PROFILE, MOCK_IDENTITY)
      expect(inner.publishVerifications).toHaveBeenCalledWith(TEST_VERIFICATIONS, MOCK_IDENTITY)
      expect(inner.publishAttestations).toHaveBeenCalledWith(TEST_ATTESTATIONS, MOCK_IDENTITY)

      // All should be cleared
      const dirtyAfter = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirtyAfter.size).toBe(0)
    })

    it('should clear individually on partial success', async () => {
      // Mark all as dirty
      await syncStore.markDirty(ALICE_DID, 'profile')
      await syncStore.markDirty(ALICE_DID, 'verifications')
      await syncStore.markDirty(ALICE_DID, 'attestations')

      // Inner: profile succeeds, verifications fails, attestations succeeds
      inner = createMockInner({
        publishProfile: vi.fn().mockResolvedValue(undefined),
        publishVerifications: vi.fn().mockRejectedValue(new Error('Server error')),
        publishAttestations: vi.fn().mockResolvedValue(undefined),
      })
      adapter = new OfflineFirstDiscoveryAdapter(inner, syncStore)

      const getPublishData = vi.fn().mockResolvedValue({
        profile: TEST_PROFILE,
        verifications: TEST_VERIFICATIONS,
        attestations: TEST_ATTESTATIONS,
      })

      await adapter.syncPending(ALICE_DID, MOCK_IDENTITY, getPublishData)

      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.size).toBe(1)
      expect(dirty.has('verifications')).toBe(true)
      expect(dirty.has('profile')).toBe(false)
      expect(dirty.has('attestations')).toBe(false)
    })

    it('should skip fields without data in getPublishData', async () => {
      await syncStore.markDirty(ALICE_DID, 'profile')
      await syncStore.markDirty(ALICE_DID, 'verifications')

      const getPublishData = vi.fn().mockResolvedValue({
        profile: TEST_PROFILE,
        // verifications NOT provided
      })

      await adapter.syncPending(ALICE_DID, MOCK_IDENTITY, getPublishData)

      expect(inner.publishProfile).toHaveBeenCalled()
      expect(inner.publishVerifications).not.toHaveBeenCalled()

      // Profile cleared, verifications still dirty (no data to retry with)
      const dirty = await syncStore.getDirtyFields(ALICE_DID)
      expect(dirty.has('profile')).toBe(false)
      expect(dirty.has('verifications')).toBe(true)
    })

    it('should use fresh data from getPublishData callback', async () => {
      await syncStore.markDirty(ALICE_DID, 'profile')

      const updatedProfile: PublicProfile = {
        ...TEST_PROFILE,
        name: 'Alice Updated',
      }

      const getPublishData = vi.fn().mockResolvedValue({
        profile: updatedProfile,
      })

      await adapter.syncPending(ALICE_DID, MOCK_IDENTITY, getPublishData)

      // Should publish the UPDATED profile, not the stale one
      expect(inner.publishProfile).toHaveBeenCalledWith(updatedProfile, MOCK_IDENTITY)
    })
  })
})
