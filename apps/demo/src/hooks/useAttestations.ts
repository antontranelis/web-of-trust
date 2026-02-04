import { useState, useEffect, useCallback } from 'react'
import { useAdapters } from '../context'
import { useIdentity } from './useIdentity'
import type { Attestation } from '@real-life/wot-core'

export function useAttestations() {
  const { attestationService } = useAdapters()
  const { identity, keyPair } = useIdentity()
  const [attestations, setAttestations] = useState<Attestation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadAttestations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const loaded = await attestationService.getReceivedAttestations()
      setAttestations(loaded)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load attestations'))
    } finally {
      setIsLoading(false)
    }
  }, [attestationService])

  useEffect(() => {
    loadAttestations()
  }, [loadAttestations])

  const createAttestation = useCallback(
    async (
      toDid: string,
      claim: string,
      tags?: string[]
    ) => {
      if (!identity || !keyPair) {
        throw new Error('No identity found')
      }

      try {
        setError(null)
        const attestation = await attestationService.createAttestation(
          identity.did,
          toDid,
          claim,
          keyPair,
          tags
        )
        await loadAttestations()
        return attestation
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to create attestation')
        setError(err)
        throw err
      }
    },
    [identity, keyPair, attestationService, loadAttestations]
  )

  const verifyAttestation = useCallback(
    async (attestation: Attestation) => {
      try {
        return await attestationService.verifyAttestation(attestation)
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to verify attestation')
        setError(err)
        throw err
      }
    },
    [attestationService]
  )

  const importAttestation = useCallback(
    async (encoded: string) => {
      try {
        setError(null)
        const attestation = await attestationService.importAttestation(encoded)
        await loadAttestations()
        return attestation
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to import attestation')
        setError(err)
        throw err
      }
    },
    [attestationService, loadAttestations]
  )

  const setAttestationAccepted = useCallback(
    async (attestationId: string, accepted: boolean) => {
      try {
        await attestationService.setAttestationAccepted(attestationId, accepted)
        await loadAttestations()
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to update attestation')
        setError(err)
        throw err
      }
    },
    [attestationService, loadAttestations]
  )

  // Filter attestations:
  // - myAttestations: I am the sender (from)
  // - receivedAttestations: I am the recipient (to)
  const myAttestations = identity
    ? attestations.filter((a) => a.from === identity.did)
    : []

  const receivedAttestations = identity
    ? attestations.filter((a) => a.to === identity.did)
    : []

  return {
    attestations,
    myAttestations,
    receivedAttestations,
    isLoading,
    error,
    createAttestation,
    importAttestation,
    verifyAttestation,
    setAttestationAccepted,
    refresh: loadAttestations,
  }
}
