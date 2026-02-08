import { useCallback, useEffect, useMemo } from 'react'
import { useAdapters, useIdentity } from '../context'
import { useSubscribable } from './useSubscribable'
import { useMessaging } from './useMessaging'
import type { Attestation } from '@real-life/wot-core'

export function useAttestations() {
  const { attestationService, reactiveStorage } = useAdapters()
  const { identity: wotIdentity, did } = useIdentity()
  const { onMessage } = useMessaging()

  const attestationsSubscribable = useMemo(() => reactiveStorage.watchReceivedAttestations(), [reactiveStorage])
  const attestations = useSubscribable(attestationsSubscribable)

  // Listen for incoming attestations via relay
  useEffect(() => {
    const unsubscribe = onMessage(async (envelope) => {
      if (envelope.type !== 'attestation') return
      try {
        const attestation: Attestation = JSON.parse(envelope.payload)
        // Verify and save (importAttestation handles dedup + signature check)
        const encoded = btoa(JSON.stringify(attestation))
        await attestationService.importAttestation(encoded)
        console.log('Attestation received via relay:', attestation.id)
      } catch (error) {
        // Duplicate or invalid — silently ignore
        console.debug('Incoming attestation skipped:', error)
      }
    })
    return unsubscribe
  }, [onMessage, attestationService])

  const createAttestation = useCallback(
    async (toDid: string, claim: string, tags?: string[]) => {
      if (!wotIdentity || !did) {
        throw new Error('No identity found')
      }
      return attestationService.createAttestation(
        did,
        toDid,
        claim,
        (data) => wotIdentity.sign(data),
        tags
      )
    },
    [wotIdentity, did, attestationService]
  )

  const verifyAttestation = useCallback(
    async (attestation: Attestation) => {
      return attestationService.verifyAttestation(attestation)
    },
    [attestationService]
  )

  const importAttestation = useCallback(
    async (encoded: string) => {
      return attestationService.importAttestation(encoded)
    },
    [attestationService]
  )

  const setAttestationAccepted = useCallback(
    async (attestationId: string, accepted: boolean) => {
      await attestationService.setAttestationAccepted(attestationId, accepted)
    },
    [attestationService]
  )

  const myAttestations = useMemo(
    () => did ? attestations.filter(a => a.from === did) : [],
    [attestations, did]
  )

  const receivedAttestations = useMemo(
    () => did ? attestations.filter(a => a.to === did) : [],
    [attestations, did]
  )

  return {
    attestations,
    myAttestations,
    receivedAttestations,
    isLoading: false,
    error: null,
    createAttestation,
    importAttestation,
    verifyAttestation,
    setAttestationAccepted,
    refresh: () => {},
  }
}
