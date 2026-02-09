import { useState, useCallback } from 'react'
import { VerificationHelper } from '@real-life/wot-core'
import type { VerificationChallenge, VerificationResponse } from '@real-life/wot-core'
import { useAdapters } from '../context'
import { useIdentity } from '../context'
import { useContacts } from './useContacts'

type VerificationStep = 'idle' | 'initiating' | 'responding' | 'completing' | 'done' | 'error'

/**
 * Hook for in-person verification flow using WotIdentity
 */
export function useVerification() {
  const { verificationService, storage } = useAdapters()
  const { identity, did } = useIdentity()
  const { addContact } = useContacts()

  const getProfileName = useCallback(async () => {
    const id = await storage.getIdentity()
    return id?.profile.name || ''
  }, [storage])

  const [step, setStep] = useState<VerificationStep>('idle')
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null)
  const [response, setResponse] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const createChallenge = useCallback(async () => {
    if (!identity) {
      throw new Error('No identity found')
    }

    try {
      setStep('initiating')
      setError(null)

      const name = await getProfileName()
      const challengeCode = await VerificationHelper.createChallenge(identity, name)
      const decodedChallenge = JSON.parse(atob(challengeCode))
      setChallenge(decodedChallenge)

      return challengeCode
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create challenge')
      setError(err)
      setStep('error')
      throw err
    }
  }, [identity, getProfileName])

  const respondToChallenge = useCallback(
    async (challengeCode: string) => {
      if (!identity) {
        throw new Error('No identity found')
      }

      try {
        setStep('responding')
        setError(null)

        const decodedChallenge = JSON.parse(atob(challengeCode))
        setChallenge(decodedChallenge)

        const name = await getProfileName()
        const responseCode = await VerificationHelper.respondToChallenge(
          challengeCode,
          identity,
          name
        )

        const decodedResponse = JSON.parse(atob(responseCode))
        setResponse(decodedResponse)

        // Add the challenge initiator as an active contact
        await addContact(
          decodedChallenge.fromDid,
          decodedChallenge.fromPublicKey,
          decodedChallenge.fromName,
          'active'
        )

        setStep('done')
        return responseCode
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to respond to challenge')
        setError(err)
        setStep('error')
        throw err
      }
    },
    [identity, addContact, getProfileName]
  )

  const completeVerification = useCallback(
    async (responseCode: string) => {
      if (!identity) {
        throw new Error('No identity found')
      }

      try {
        setStep('completing')
        setError(null)

        const decodedResponse = JSON.parse(atob(responseCode))
        setResponse(decodedResponse)

        // Use nonce from response if challenge state is lost
        const expectedNonce = challenge?.nonce || decodedResponse.nonce

        // Complete verification with VerificationHelper
        const verification = await VerificationHelper.completeVerification(
          responseCode,
          identity,
          expectedNonce
        )

        // Save verification to storage
        await verificationService.saveVerification(verification)

        // Add responder as active contact
        await addContact(
          decodedResponse.toDid,
          decodedResponse.toPublicKey,
          decodedResponse.toName,
          'active'
        )

        setStep('done')
        return verification
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to complete verification')
        setError(err)
        setStep('error')
        throw err
      }
    },
    [identity, verificationService, addContact, challenge]
  )

  const reset = useCallback(() => {
    setStep('idle')
    setChallenge(null)
    setResponse(null)
    setError(null)
  }, [])

  return {
    step,
    challenge,
    response,
    error,
    createChallenge,
    respondToChallenge,
    completeVerification,
    reset,
  }
}
