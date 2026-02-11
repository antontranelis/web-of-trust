import { useState, useCallback, useEffect, useRef } from 'react'
import { VerificationHelper } from '@real-life/wot-core'
import type { VerificationChallenge, VerificationResponse, MessageEnvelope } from '@real-life/wot-core'
import { useAdapters } from '../context'
import { useIdentity } from '../context'
import { usePendingVerification } from '../context'
import { useContacts } from './useContacts'
import { useMessaging } from './useMessaging'
import { useProfileSync } from './useProfileSync'
import type { VerificationPayload } from '../types/verification-messages'

type VerificationStep =
  | 'idle'
  | 'initiating'           // Alice: QR shown, waiting for relay response
  | 'confirm-respond'      // Bob: sees Alice's profile, must confirm before responding
  | 'responding'           // Bob: processing scanned challenge
  | 'waiting-for-complete' // Bob: response sent via relay, waiting for confirmation
  | 'confirm-complete'     // Alice: sees Bob's profile, must confirm before completing
  | 'completing'           // Alice: auto-completing verification
  | 'done'
  | 'error'

/**
 * Hook for in-person verification flow using WotIdentity.
 *
 * Supports relay-assisted flow: after Bob scans Alice's QR code,
 * the response is sent via relay. Alice auto-completes and sends
 * confirmation back. Only ONE QR scan needed.
 *
 * Falls back to manual code exchange if relay is offline.
 */
export function useVerification() {
  const { verificationService, storage } = useAdapters()
  const { identity, did } = useIdentity()
  const { addContact, activeContacts } = useContacts()
  const { send, onMessage, isConnected } = useMessaging()
  const { pending, setPending, setChallengeNonce, triggerConfetti } = usePendingVerification()
  const { syncContactProfile } = useProfileSync()

  const getProfileName = useCallback(async () => {
    const id = await storage.getIdentity()
    return id?.profile.name || ''
  }, [storage])

  const [step, setStep] = useState<VerificationStep>('idle')
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null)
  const [response, setResponse] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [peerName, setPeerName] = useState<string | null>(null)
  const [peerDid, setPeerDid] = useState<string | null>(null)

  // Refs to avoid stale closures in the onMessage listener
  const stepRef = useRef(step)
  stepRef.current = step
  const challengeNonceRef = useRef<string | null>(null)
  const activeContactsRef = useRef(activeContacts)
  activeContactsRef.current = activeContacts
  const peerNameRef = useRef(peerName)
  peerNameRef.current = peerName

  // Pending data for confirmation steps
  const pendingChallengeCodeRef = useRef<string | null>(null)
  const pendingResponseCodeRef = useRef<string | null>(null)
  const pendingDecodedRef = useRef<Record<string, string> | null>(null)

  // Consume pending verification from global listener (if Alice was away from /verify)
  useEffect(() => {
    if (pending && step === 'idle') {
      pendingResponseCodeRef.current = pending.responseCode
      pendingDecodedRef.current = pending.decoded
      challengeNonceRef.current = pending.decoded.nonce
      setPeerName(pending.decoded.toName || null)
      setPeerDid(pending.decoded.toDid || null)
      setStep('confirm-complete')
      setPending(null)
    }
  }, [pending, step, setPending])

  // Listen for incoming verification messages via relay
  useEffect(() => {
    const unsubscribe = onMessage(async (envelope: MessageEnvelope) => {
      if (envelope.type !== 'verification') return

      let payload: VerificationPayload
      try {
        payload = JSON.parse(envelope.payload)
      } catch {
        return
      }

      if (payload.action === 'response') {
        // ALICE receives Bob's response via relay
        if (stepRef.current !== 'initiating') return

        try {
          const responseCode = payload.responseCode
          const decoded = JSON.parse(atob(responseCode))

          // Validate nonce matches our challenge
          if (decoded.nonce !== challengeNonceRef.current) return

          // Skip confirm screen if peer is already a verified contact
          const alreadyContact = activeContactsRef.current.some(c => c.did === decoded.toDid)
          if (alreadyContact) return

          // Store pending data and pause for confirmation
          pendingResponseCodeRef.current = responseCode
          pendingDecodedRef.current = decoded
          setPeerName(decoded.toName || null)
          setPeerDid(decoded.toDid || null)
          setStep('confirm-complete')
        } catch (e) {
          setError(e instanceof Error ? e : new Error('Failed to complete verification'))
          setStep('error')
        }
      }

      if (payload.action === 'complete') {
        // BOB receives Alice's verification-complete
        if (stepRef.current !== 'waiting-for-complete') return

        try {
          const verification = payload.verification
          const isValid = await VerificationHelper.verifySignature(verification)
          if (!isValid) return

          await verificationService.saveVerification(verification)
          const name = peerNameRef.current || 'Kontakt'
          triggerConfetti(`${name} und du habt euch gegenseitig verifiziert!`)
          setStep('done')
        } catch {
          // Ignore invalid complete messages
        }
      }
    })
    return unsubscribe
  }, [onMessage, identity, did, verificationService, addContact, send, triggerConfetti])

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
      challengeNonceRef.current = decodedChallenge.nonce
      setChallengeNonce(decodedChallenge.nonce)

      return challengeCode
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create challenge')
      setError(err)
      setStep('error')
      throw err
    }
  }, [identity, getProfileName, setChallengeNonce])

  // Step 1: Decode challenge and show peer info for confirmation
  const prepareResponse = useCallback(
    async (challengeCode: string) => {
      try {
        setError(null)

        const decodedChallenge = JSON.parse(atob(challengeCode))
        setChallenge(decodedChallenge)
        setPeerName(decodedChallenge.fromName || null)
        setPeerDid(decodedChallenge.fromDid || null)

        // Store for later use after confirmation
        pendingChallengeCodeRef.current = challengeCode
        setStep('confirm-respond')
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Ungültiger Code')
        setError(err)
        setStep('error')
        throw err
      }
    },
    []
  )

  // Step 2: After Bob confirms, create crypto response and send
  const confirmAndRespond = useCallback(
    async () => {
      if (!identity) {
        throw new Error('No identity found')
      }

      const challengeCode = pendingChallengeCodeRef.current
      if (!challengeCode) {
        throw new Error('No pending challenge')
      }

      try {
        setStep('responding')
        setError(null)

        const decodedChallenge = JSON.parse(atob(challengeCode))

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
        syncContactProfile(decodedChallenge.fromDid)

        // Send response via relay if connected
        if (isConnected) {
          const responsePayload: VerificationPayload = {
            action: 'response',
            responseCode,
          }
          const envelope: MessageEnvelope = {
            v: 1,
            id: `ver-${crypto.randomUUID()}`,
            type: 'verification',
            fromDid: did!,
            toDid: decodedChallenge.fromDid,
            createdAt: new Date().toISOString(),
            encoding: 'json',
            payload: JSON.stringify(responsePayload),
            signature: '',
          }
          await send(envelope)
          setStep('waiting-for-complete')
        } else {
          // Fallback: no relay, return response code for manual exchange
          setStep('done')
        }

        pendingChallengeCodeRef.current = null
        return responseCode
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to respond to challenge')
        setError(err)
        setStep('error')
        throw err
      }
    },
    [identity, addContact, getProfileName, isConnected, send, did, syncContactProfile]
  )

  // Alice confirms Bob's profile and completes verification (relay flow)
  const confirmAndComplete = useCallback(
    async () => {
      if (!identity) {
        throw new Error('No identity found')
      }

      const responseCode = pendingResponseCodeRef.current
      const decoded = pendingDecodedRef.current
      if (!responseCode || !decoded) {
        throw new Error('No pending response')
      }

      try {
        setStep('completing')
        setError(null)

        const verification = await VerificationHelper.completeVerification(
          responseCode,
          identity,
          challengeNonceRef.current!
        )

        await verificationService.saveVerification(verification)
        await addContact(decoded.toDid, decoded.toPublicKey, decoded.toName, 'active')
        syncContactProfile(decoded.toDid)

        // Send verification-complete back to Bob
        const completePayload: VerificationPayload = {
          action: 'complete',
          verification,
        }
        const completeEnvelope: MessageEnvelope = {
          v: 1,
          id: verification.id,
          type: 'verification',
          fromDid: did!,
          toDid: decoded.toDid,
          createdAt: new Date().toISOString(),
          encoding: 'json',
          payload: JSON.stringify(completePayload),
          signature: verification.proof.proofValue,
        }
        send(completeEnvelope).catch(() => {
          // Non-critical: Bob already has the contact, just misses the confetti trigger
        })

        pendingResponseCodeRef.current = null
        pendingDecodedRef.current = null
        const name = decoded.toName || 'Kontakt'
        triggerConfetti(`${name} und du habt euch gegenseitig verifiziert!`)
        setStep('done')
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to complete verification'))
        setStep('error')
      }
    },
    [identity, did, verificationService, addContact, send, triggerConfetti, syncContactProfile]
  )

  // Manual complete (fallback when relay is offline)
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

        const verification = await VerificationHelper.completeVerification(
          responseCode,
          identity,
          expectedNonce
        )

        await verificationService.saveVerification(verification)
        await addContact(
          decodedResponse.toDid,
          decodedResponse.toPublicKey,
          decodedResponse.toName,
          'active'
        )
        syncContactProfile(decodedResponse.toDid)

        setStep('done')
        return verification
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to complete verification')
        setError(err)
        setStep('error')
        throw err
      }
    },
    [identity, verificationService, addContact, challenge, syncContactProfile]
  )

  const reset = useCallback(() => {
    setStep('idle')
    setChallenge(null)
    setResponse(null)
    setError(null)
    setPeerName(null)
    setPeerDid(null)
    challengeNonceRef.current = null
    pendingChallengeCodeRef.current = null
    pendingResponseCodeRef.current = null
    pendingDecodedRef.current = null
    setChallengeNonce(null)
    setPending(null)
  }, [setChallengeNonce, setPending])

  return {
    step,
    challenge,
    response,
    error,
    peerName,
    peerDid,
    isConnected,
    createChallenge,
    prepareResponse,
    confirmAndRespond,
    confirmAndComplete,
    completeVerification,
    reset,
  }
}
