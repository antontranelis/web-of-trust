import { useState, useEffect, useCallback } from 'react'
import { useAdapters } from '../context'
import { useIdentity } from './useIdentity'
import type { Attestation, AttestationType } from '../types'

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
      const loaded = await attestationService.getAttestations()
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
      subjectDid: string,
      type: AttestationType,
      content: string,
      tags?: string[]
    ) => {
      if (!identity || !keyPair) {
        throw new Error('No identity found')
      }

      try {
        setError(null)
        const attestation = await attestationService.createAttestation(
          identity.did,
          subjectDid,
          type,
          content,
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

  const getAttestationsAbout = useCallback(
    async (subjectDid: string) => {
      try {
        return await attestationService.getAttestationsAbout(subjectDid)
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to get attestations')
        setError(err)
        throw err
      }
    },
    [attestationService]
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

  // Filter attestations by current user
  const myAttestations = identity
    ? attestations.filter((a) => a.issuerDid === identity.did)
    : []

  const receivedAttestations = identity
    ? attestations.filter((a) => a.subjectDid === identity.did)
    : []

  return {
    attestations,
    myAttestations,
    receivedAttestations,
    isLoading,
    error,
    createAttestation,
    getAttestationsAbout,
    verifyAttestation,
    refresh: loadAttestations,
  }
}
