import { useState, useCallback } from 'react'
import { useAdapters } from '../context'
import { useIdentity } from './useIdentity'
import { useContacts } from './useContacts'
import type { VerificationChallenge, VerificationResponse } from '@web-of-trust/core'

type VerificationStep = 'idle' | 'initiating' | 'responding' | 'completing' | 'done' | 'error'

export function useVerification() {
  const { verificationService } = useAdapters()
  const { identity, keyPair } = useIdentity()
  const { addContact, verifyContact: markVerified } = useContacts()

  const [step, setStep] = useState<VerificationStep>('idle')
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null)
  const [response, setResponse] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const createChallenge = useCallback(async () => {
    if (!identity || !keyPair) {
      throw new Error('No identity found')
    }

    try {
      setStep('initiating')
      setError(null)
      const newChallenge = await verificationService.createChallenge(identity, keyPair)
      setChallenge(newChallenge)
      return verificationService.encodeChallenge(newChallenge)
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create challenge')
      setError(err)
      setStep('error')
      throw err
    }
  }, [identity, keyPair, verificationService])

  const respondToChallenge = useCallback(
    async (encodedChallenge: string) => {
      if (!identity || !keyPair) {
        throw new Error('No identity found')
      }

      try {
        setStep('responding')
        setError(null)
        const decodedChallenge = verificationService.decodeChallenge(encodedChallenge)
        setChallenge(decodedChallenge)

        const newResponse = await verificationService.createResponse(decodedChallenge, identity, keyPair)
        setResponse(newResponse)

        // Add initiator as pending contact
        await addContact(decodedChallenge.initiatorDid, {
          name: decodedChallenge.initiatorProfile.name,
        }, 'verified')

        setStep('done')
        return verificationService.encodeResponse(newResponse)
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to respond to challenge')
        setError(err)
        setStep('error')
        throw err
      }
    },
    [identity, keyPair, verificationService, addContact]
  )

  const completeVerification = useCallback(
    async (encodedResponse: string) => {
      if (!identity || !keyPair || !challenge) {
        throw new Error('No challenge found')
      }

      try {
        setStep('completing')
        setError(null)
        const decodedResponse = verificationService.decodeResponse(encodedResponse)
        setResponse(decodedResponse)

        // Complete verification
        const verification = await verificationService.completeVerification(
          challenge,
          decodedResponse,
          keyPair
        )

        // Add responder as verified contact
        await addContact(decodedResponse.responderDid, {
          name: decodedResponse.responderProfile.name,
        }, 'verified')

        setStep('done')
        return verification
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to complete verification')
        setError(err)
        setStep('error')
        throw err
      }
    },
    [identity, keyPair, challenge, verificationService, addContact]
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
