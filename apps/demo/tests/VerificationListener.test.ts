/**
 * Tests for the global verification listener.
 *
 * The listener:
 * 1. Receives a verification message
 * 2. Verifies the signature
 * 3. Saves it to storage
 * 4. If I'm the recipient and haven't verified the sender yet →
 *    - Known contact: auto counter-verify (trusted)
 *    - Unknown sender with valid nonce: set pendingIncoming for user confirmation
 *    - Unknown sender without nonce: ignore (spam)
 *
 * Confetti is handled separately by a reactive mutual-detection effect.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VerificationHelper } from '@real-life/wot-core'
import type { Verification, MessageEnvelope } from '@real-life/wot-core'

// --- Test helpers ---

const ALICE_DID = 'did:key:z6MkAlice'
const BOB_DID = 'did:key:z6MkBob'
const CHALLENGE_NONCE = 'test-nonce-12345'

function makeVerification(from: string, to: string, id?: string): Verification {
  return {
    id: id || `urn:uuid:ver-${Math.random()}`,
    from,
    to,
    timestamp: new Date().toISOString(),
    proof: {
      type: 'Ed25519Signature2020',
      verificationMethod: `${from}#key-1`,
      created: new Date().toISOString(),
      proofPurpose: 'authentication',
      proofValue: 'test-signature',
    },
  }
}

/** Creates a verification with an ID that contains the given nonce (as createVerificationFor does). */
function makeVerificationWithNonce(from: string, to: string, nonce: string): Verification {
  return makeVerification(from, to, `urn:uuid:ver-${nonce}-${from.slice(-8)}`)
}

function makeVerificationEnvelope(fromDid: string, toDid: string, verification: Verification): MessageEnvelope {
  return {
    v: 1,
    id: `ver-${crypto.randomUUID()}`,
    type: 'verification',
    fromDid,
    toDid,
    createdAt: new Date().toISOString(),
    encoding: 'json',
    payload: JSON.stringify(verification),
    signature: '',
  }
}

/**
 * Simulates the verification listener logic from App.tsx.
 *
 * Two paths for counter-verification:
 * 1. Known contact → auto counter-verify
 * 2. Unknown sender with valid nonce → setPendingIncoming (user must confirm)
 */
function createVerificationListener(deps: {
  myDid: string
  contacts: Array<{ did: string; name?: string }>
  existingVerifications: Verification[]
  challengeNonce: string | null
  saveVerification: (v: Verification) => Promise<void>
  setChallengeNonce: (nonce: string | null) => void
  setPendingIncoming: (pending: { verification: Verification; fromDid: string } | null) => void
  createCounterVerification: (toDid: string) => Promise<Verification>
  sendEnvelope: (envelope: MessageEnvelope) => Promise<void>
}) {
  return async (envelope: MessageEnvelope) => {
    if (envelope.type !== 'verification') return

    let verification: Verification
    try {
      verification = JSON.parse(envelope.payload)
    } catch {
      return
    }

    if (!verification.id || !verification.from || !verification.to || !verification.proof) return

    try {
      const isValid = await VerificationHelper.verifySignature(verification)
      if (!isValid) return

      await deps.saveVerification(verification)
    } catch {
      return
    }

    // Counter-verification logic
    if (verification.to === deps.myDid) {
      const alreadyVerified = deps.existingVerifications.some(
        v => v.from === deps.myDid && v.to === verification.from
      )

      if (!alreadyVerified) {
        const isContact = deps.contacts.some(c => c.did === verification.from)

        if (isContact) {
          // Known contact: auto counter-verify
          try {
            const counter = await deps.createCounterVerification(verification.from)
            await deps.saveVerification(counter)

            const counterEnvelope: MessageEnvelope = {
              v: 1,
              id: counter.id,
              type: 'verification',
              fromDid: deps.myDid,
              toDid: verification.from,
              createdAt: new Date().toISOString(),
              encoding: 'json',
              payload: JSON.stringify(counter),
              signature: counter.proof.proofValue,
            }
            await deps.sendEnvelope(counterEnvelope)
          } catch {
            // Counter-verification failed — non-critical
          }
        } else {
          // Unknown sender: only accept if nonce proves QR scan
          if (deps.challengeNonce && verification.id.includes(deps.challengeNonce)) {
            deps.setChallengeNonce(null) // Nonce consumed
            deps.setPendingIncoming({ verification, fromDid: verification.from })
          }
          // else: spam — ignore
        }
      }
    }
  }
}

// --- Tests ---

describe('Verification Listener', () => {
  let saveVerification: ReturnType<typeof vi.fn>
  let setChallengeNonce: ReturnType<typeof vi.fn>
  let setPendingIncoming: ReturnType<typeof vi.fn>
  let createCounterVerification: ReturnType<typeof vi.fn>
  let sendEnvelope: ReturnType<typeof vi.fn>

  beforeEach(() => {
    saveVerification = vi.fn().mockResolvedValue(undefined)
    setChallengeNonce = vi.fn()
    setPendingIncoming = vi.fn()
    createCounterVerification = vi.fn().mockResolvedValue(makeVerification(ALICE_DID, BOB_DID))
    sendEnvelope = vi.fn().mockResolvedValue(undefined)
    vi.restoreAllMocks()
  })

  function defaultDeps(overrides?: Partial<Parameters<typeof createVerificationListener>[0]>) {
    return {
      myDid: ALICE_DID,
      contacts: [] as Array<{ did: string; name?: string }>,
      existingVerifications: [] as Verification[],
      challengeNonce: null as string | null,
      saveVerification,
      setChallengeNonce,
      setPendingIncoming,
      createCounterVerification,
      sendEnvelope,
      ...overrides,
    }
  }

  describe('receiving a valid verification', () => {
    it('should verify signature and save verification', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)

      const handler = createVerificationListener(defaultDeps())
      const verification = makeVerification(BOB_DID, ALICE_DID)

      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, verification))

      expect(VerificationHelper.verifySignature).toHaveBeenCalledWith(verification)
      expect(saveVerification).toHaveBeenCalledWith(verification)
    })
  })

  describe('auto counter-verification (known contact)', () => {
    it('should auto counter-verify known contact WITHOUT user confirmation', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)
      const counterVer = makeVerification(ALICE_DID, BOB_DID, 'counter-id')
      createCounterVerification.mockResolvedValue(counterVer)

      const handler = createVerificationListener(defaultDeps({
        contacts: [{ did: BOB_DID, name: 'Bob' }], // Already a contact
        challengeNonce: null, // No active challenge — doesn't matter
      }))

      const bobVerifiesAlice = makeVerification(BOB_DID, ALICE_DID)
      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, bobVerifiesAlice))

      // Auto counter-verify: no user confirmation needed
      expect(setPendingIncoming).not.toHaveBeenCalled()
      expect(saveVerification).toHaveBeenCalledTimes(2)
      expect(sendEnvelope).toHaveBeenCalled()
    })

    it('should NOT counter-verify when already verified', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)

      const existingVerification = makeVerification(ALICE_DID, BOB_DID)

      const handler = createVerificationListener(defaultDeps({
        contacts: [{ did: BOB_DID }],
        existingVerifications: [existingVerification],
      }))

      const bobVerifiesAlice = makeVerification(BOB_DID, ALICE_DID)
      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, bobVerifiesAlice))

      expect(saveVerification).toHaveBeenCalledTimes(1)
      expect(createCounterVerification).not.toHaveBeenCalled()
      expect(setPendingIncoming).not.toHaveBeenCalled()
    })

    it('should NOT counter-verify when I am the sender', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)

      const handler = createVerificationListener(defaultDeps({
        contacts: [{ did: BOB_DID }],
      }))

      const aliceVerifiesBob = makeVerification(ALICE_DID, BOB_DID)
      await handler(makeVerificationEnvelope(ALICE_DID, BOB_DID, aliceVerifiesBob))

      expect(saveVerification).toHaveBeenCalledTimes(1)
      expect(createCounterVerification).not.toHaveBeenCalled()
      expect(setPendingIncoming).not.toHaveBeenCalled()
    })

    it('should handle counter-verification failure gracefully', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)
      createCounterVerification.mockRejectedValue(new Error('identity locked'))

      const handler = createVerificationListener(defaultDeps({
        contacts: [{ did: BOB_DID }],
      }))

      const bobVerifiesAlice = makeVerification(BOB_DID, ALICE_DID)
      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, bobVerifiesAlice))

      expect(saveVerification).toHaveBeenCalledTimes(1)
    })
  })

  describe('pending incoming (unknown sender with nonce)', () => {
    it('should set pendingIncoming when unknown sender has valid nonce', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)

      const handler = createVerificationListener(defaultDeps({
        contacts: [],
        challengeNonce: CHALLENGE_NONCE,
      }))

      const bobVerifiesAlice = makeVerificationWithNonce(BOB_DID, ALICE_DID, CHALLENGE_NONCE)
      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, bobVerifiesAlice))

      // Verification saved
      expect(saveVerification).toHaveBeenCalledTimes(1)

      // Pending set for user confirmation (NOT auto-added)
      expect(setPendingIncoming).toHaveBeenCalledWith({
        verification: bobVerifiesAlice,
        fromDid: BOB_DID,
      })

      // Nonce consumed
      expect(setChallengeNonce).toHaveBeenCalledWith(null)

      // NO auto counter-verify
      expect(createCounterVerification).not.toHaveBeenCalled()
      expect(sendEnvelope).not.toHaveBeenCalled()
    })

    it('should REJECT unknown sender without active nonce (spam)', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)

      const handler = createVerificationListener(defaultDeps({
        contacts: [],
        challengeNonce: null,
      }))

      const bobVerifiesAlice = makeVerification(BOB_DID, ALICE_DID)
      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, bobVerifiesAlice))

      expect(saveVerification).toHaveBeenCalledTimes(1)
      expect(setPendingIncoming).not.toHaveBeenCalled()
      expect(createCounterVerification).not.toHaveBeenCalled()
    })

    it('should REJECT unknown sender with wrong nonce (spam)', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)

      const handler = createVerificationListener(defaultDeps({
        contacts: [],
        challengeNonce: CHALLENGE_NONCE,
      }))

      const bobVerifiesAlice = makeVerificationWithNonce(BOB_DID, ALICE_DID, 'wrong-nonce')
      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, bobVerifiesAlice))

      expect(saveVerification).toHaveBeenCalledTimes(1)
      expect(setPendingIncoming).not.toHaveBeenCalled()
      expect(createCounterVerification).not.toHaveBeenCalled()
    })
  })

  describe('rejecting invalid verifications', () => {
    it('should reject verification with invalid signature', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(false)

      const handler = createVerificationListener(defaultDeps())
      const fakeVerification = makeVerification(BOB_DID, ALICE_DID)

      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, fakeVerification))

      expect(saveVerification).not.toHaveBeenCalled()
      expect(createCounterVerification).not.toHaveBeenCalled()
      expect(setPendingIncoming).not.toHaveBeenCalled()
    })

    it('should reject verification when verifySignature throws', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockRejectedValue(new Error('crypto error'))

      const handler = createVerificationListener(defaultDeps())
      const verification = makeVerification(BOB_DID, ALICE_DID)

      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, verification))

      expect(saveVerification).not.toHaveBeenCalled()
    })

    it('should reject payload missing required Verification fields', async () => {
      const handler = createVerificationListener(defaultDeps())

      const envelope: MessageEnvelope = {
        v: 1,
        id: 'msg-1',
        type: 'verification',
        fromDid: BOB_DID,
        toDid: ALICE_DID,
        createdAt: new Date().toISOString(),
        encoding: 'json',
        payload: JSON.stringify({ action: 'response', responseCode: 'abc' }),
        signature: '',
      }

      await handler(envelope)

      expect(saveVerification).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should ignore non-verification messages', async () => {
      const handler = createVerificationListener(defaultDeps())

      const envelope: MessageEnvelope = {
        v: 1,
        id: 'msg-1',
        type: 'attestation',
        fromDid: BOB_DID,
        toDid: ALICE_DID,
        createdAt: new Date().toISOString(),
        encoding: 'json',
        payload: '{}',
        signature: '',
      }

      await handler(envelope)

      expect(saveVerification).not.toHaveBeenCalled()
    })

    it('should handle malformed payload gracefully', async () => {
      const handler = createVerificationListener(defaultDeps())

      const envelope: MessageEnvelope = {
        v: 1,
        id: 'msg-1',
        type: 'verification',
        fromDid: BOB_DID,
        toDid: ALICE_DID,
        createdAt: new Date().toISOString(),
        encoding: 'json',
        payload: 'not-json',
        signature: '',
      }

      await handler(envelope)

      expect(saveVerification).not.toHaveBeenCalled()
    })

    it('should handle saveVerification failure gracefully', async () => {
      vi.spyOn(VerificationHelper, 'verifySignature').mockResolvedValue(true)
      saveVerification.mockRejectedValue(new Error('storage full'))

      const handler = createVerificationListener(defaultDeps())
      const verification = makeVerification(BOB_DID, ALICE_DID)

      await handler(makeVerificationEnvelope(BOB_DID, ALICE_DID, verification))

      expect(saveVerification).toHaveBeenCalledTimes(1)
      expect(createCounterVerification).not.toHaveBeenCalled()
      expect(setPendingIncoming).not.toHaveBeenCalled()
    })
  })
})
