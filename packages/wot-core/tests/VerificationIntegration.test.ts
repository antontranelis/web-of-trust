import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WotIdentity } from '../src/identity/WotIdentity'
import { VerificationHelper } from '../src/verification/VerificationHelper'

describe('Verification with WotIdentity', () => {
  let anna: WotIdentity
  let ben: WotIdentity
  let annaDid: string
  let benDid: string

  beforeEach(async () => {
    // Create two identities for testing
    anna = new WotIdentity()
    const annaResult = await anna.create('anna-passphrase', false)
    annaDid = annaResult.did

    ben = new WotIdentity()
    const benResult = await ben.create('ben-passphrase', false)
    benDid = benResult.did
  })

  afterEach(async () => {
    // Cleanup if needed
    await anna.lock()
    await ben.lock()
  })

  describe('Challenge Creation', () => {
    it('should create challenge with WotIdentity DID and public key', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')

      expect(challengeCode).toBeDefined()
      expect(typeof challengeCode).toBe('string')

      // Decode and verify contents
      const challenge = JSON.parse(atob(challengeCode))
      expect(challenge.fromDid).toBe(annaDid)
      expect(challenge.fromPublicKey).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/)
      expect(challenge.fromName).toBe('Anna')
      expect(challenge.nonce).toBeDefined()
      expect(challenge.timestamp).toBeDefined()
    })

    it('should encode challenge to base64', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')

      // Base64 should only contain A-Z, a-z, 0-9, +, /, =
      expect(challengeCode).toMatch(/^[A-Za-z0-9+/]+=*$/)

      // Should be decodable
      expect(() => JSON.parse(atob(challengeCode))).not.toThrow()
    })

    it('should generate unique nonce for each challenge', async () => {
      const code1 = await VerificationHelper.createChallenge(anna, 'Anna')
      const code2 = await VerificationHelper.createChallenge(anna, 'Anna')

      const challenge1 = JSON.parse(atob(code1))
      const challenge2 = JSON.parse(atob(code2))

      expect(challenge1.nonce).not.toBe(challenge2.nonce)
    })
  })

  describe('Challenge Response', () => {
    it('should respond to challenge with own identity', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      expect(responseCode).toBeDefined()
      expect(typeof responseCode).toBe('string')

      // Decode and verify contents
      const response = JSON.parse(atob(responseCode))
      expect(response.toDid).toBe(benDid)
      expect(response.toPublicKey).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/)
      expect(response.toName).toBe('Ben')
      expect(response.nonce).toBeDefined()
      expect(response.timestamp).toBeDefined()
    })

    it('should encode response to base64', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      // Base64 should only contain A-Z, a-z, 0-9, +, /, =
      expect(responseCode).toMatch(/^[A-Za-z0-9+/]+=*$/)

      // Should be decodable
      expect(() => JSON.parse(atob(responseCode))).not.toThrow()
    })

    it('should preserve nonce from challenge', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )
      const response = JSON.parse(atob(responseCode))

      expect(response.nonce).toBe(challenge.nonce)
    })

    it('should include challenge initiator info in response', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )
      const response = JSON.parse(atob(responseCode))

      expect(response.fromDid).toBe(challenge.fromDid)
      expect(response.fromPublicKey).toBe(challenge.fromPublicKey)
      expect(response.fromName).toBe(challenge.fromName)
    })
  })

  describe('Signature Verification', () => {
    it('should sign verification data with WotIdentity', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      const verification = await VerificationHelper.completeVerification(
        responseCode,
        anna,
        challenge.nonce
      )

      expect(verification.proof.proofValue).toBeDefined()
      expect(typeof verification.proof.proofValue).toBe('string')
      expect(verification.proof.proofValue.length).toBeGreaterThan(0)
    })

    it('should verify signature using public key multibase', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      const verification = await VerificationHelper.completeVerification(
        responseCode,
        anna,
        challenge.nonce
      )

      const isValid = await VerificationHelper.verifySignature(verification)
      expect(isValid).toBe(true)
    })

    it('should create verification object with Ed25519Signature2020 proof', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      const verification = await VerificationHelper.completeVerification(
        responseCode,
        anna,
        challenge.nonce
      )

      expect(verification.proof.type).toBe('Ed25519Signature2020')
      expect(verification.proof.verificationMethod).toBe(`${annaDid}#key-1`)
      expect(verification.proof.proofPurpose).toBe('authentication')
      expect(verification.proof.created).toBeDefined()
      expect(verification.proof.proofValue).toBeDefined()
    })

    it('should fail verification with wrong public key', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      const verification = await VerificationHelper.completeVerification(
        responseCode,
        anna,
        challenge.nonce
      )

      // Tamper with the from DID
      verification.from = benDid

      const isValid = await VerificationHelper.verifySignature(verification)
      expect(isValid).toBe(false)
    })

    it('should reject verification with nonce mismatch', async () => {
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )

      // Use wrong nonce
      await expect(
        VerificationHelper.completeVerification(responseCode, anna, 'wrong-nonce')
      ).rejects.toThrow('Nonce mismatch')
    })
  })

  describe('Public Key Exchange', () => {
    it('should extract public key from did:key format', async () => {
      const pubKey = await anna.getPublicKeyMultibase()

      expect(pubKey).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/)
      expect(annaDid).toContain(pubKey)
    })

    it('should convert multibase to bytes for verification', async () => {
      const pubKeyMultibase = await anna.getPublicKeyMultibase()

      const bytes = VerificationHelper.multibaseToBytes(pubKeyMultibase)

      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBe(32) // Ed25519 public key is 32 bytes
    })

    it('should be able to parse did:key to extract public key', async () => {
      const pubKey = VerificationHelper.publicKeyFromDid(annaDid)

      expect(pubKey).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/)
      expect(await anna.getPublicKeyMultibase()).toBe(pubKey)
    })
  })

  describe('Complete Verification Flow', () => {
    it('should complete full mutual verification flow', async () => {
      // Step 1: Anna creates challenge
      const annaChallenge = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(annaChallenge))

      // Step 2: Ben responds to challenge
      const benResponse = await VerificationHelper.respondToChallenge(
        annaChallenge,
        ben,
        'Ben'
      )

      // Step 3: Anna completes verification
      const verification = await VerificationHelper.completeVerification(
        benResponse,
        anna,
        challenge.nonce
      )

      // Verify structure
      expect(verification.id).toContain(challenge.nonce)
      expect(verification.from).toBe(annaDid)
      expect(verification.to).toBe(benDid)
      expect(verification.timestamp).toBeDefined()
      expect(verification.proof).toBeDefined()

      // Verify signature
      const isValid = await VerificationHelper.verifySignature(verification)
      expect(isValid).toBe(true)
    })

    it('should support bidirectional verification', async () => {
      // Anna → Ben
      const annaChallenge = await VerificationHelper.createChallenge(anna, 'Anna')
      const challengeA = JSON.parse(atob(annaChallenge))
      const benResponse = await VerificationHelper.respondToChallenge(
        annaChallenge,
        ben,
        'Ben'
      )
      const verificationAtoB = await VerificationHelper.completeVerification(
        benResponse,
        anna,
        challengeA.nonce
      )

      // Ben → Anna
      const benChallenge = await VerificationHelper.createChallenge(ben, 'Ben')
      const challengeB = JSON.parse(atob(benChallenge))
      const annaResponse = await VerificationHelper.respondToChallenge(
        benChallenge,
        anna,
        'Anna'
      )
      const verificationBtoA = await VerificationHelper.completeVerification(
        annaResponse,
        ben,
        challengeB.nonce
      )

      // Both verifications should be valid
      expect(await VerificationHelper.verifySignature(verificationAtoB)).toBe(true)
      expect(await VerificationHelper.verifySignature(verificationBtoA)).toBe(true)

      // Verification directions
      expect(verificationAtoB.from).toBe(annaDid)
      expect(verificationAtoB.to).toBe(benDid)
      expect(verificationBtoA.from).toBe(benDid)
      expect(verificationBtoA.to).toBe(annaDid)
    })

    it('should create counter-verification with createVerificationFor', async () => {
      // Simulates relay flow: Alice creates challenge, Bob responds AND creates counter-verification
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      // Bob creates his counter-verification for Anna (from=Ben, to=Anna)
      const counterVerification = await VerificationHelper.createVerificationFor(
        ben,
        annaDid,
        challenge.nonce
      )

      expect(counterVerification.from).toBe(benDid)
      expect(counterVerification.to).toBe(annaDid)
      expect(counterVerification.id).toContain(challenge.nonce)

      // Signature must be valid
      const isValid = await VerificationHelper.verifySignature(counterVerification)
      expect(isValid).toBe(true)
    })

    it('should produce two distinct verifications in relay flow', async () => {
      // Full relay flow: one QR scan produces TWO verifications
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(challengeCode, ben, 'Ben')

      // Alice's verification: from=Anna, to=Ben (via completeVerification)
      const aliceVerification = await VerificationHelper.completeVerification(
        responseCode, anna, challenge.nonce
      )

      // Bob's counter-verification: from=Ben, to=Anna (via createVerificationFor)
      const bobVerification = await VerificationHelper.createVerificationFor(
        ben, annaDid, challenge.nonce
      )

      // Both must be valid
      expect(await VerificationHelper.verifySignature(aliceVerification)).toBe(true)
      expect(await VerificationHelper.verifySignature(bobVerification)).toBe(true)

      // Directions are opposite
      expect(aliceVerification.from).toBe(annaDid)
      expect(aliceVerification.to).toBe(benDid)
      expect(bobVerification.from).toBe(benDid)
      expect(bobVerification.to).toBe(annaDid)

      // Different IDs
      expect(aliceVerification.id).not.toBe(bobVerification.id)
    })

    it('should use nonce from response when challenge state is lost', async () => {
      // Scenario: User navigates away or reloads page after creating challenge
      // Challenge state is lost, but response contains the nonce
      const challengeCode = await VerificationHelper.createChallenge(anna, 'Anna')
      const challenge = JSON.parse(atob(challengeCode))

      const responseCode = await VerificationHelper.respondToChallenge(
        challengeCode,
        ben,
        'Ben'
      )
      const response = JSON.parse(atob(responseCode))

      // Simulate lost challenge state by completing verification
      // using ONLY the response code (not the original challenge)
      // This is the actual fix: expectedNonce = challenge?.nonce || response.nonce
      const verification = await VerificationHelper.completeVerification(
        responseCode,
        anna,
        response.nonce // Use nonce from response as fallback
      )

      // Verification should succeed
      expect(verification).toBeDefined()
      expect(verification.from).toBe(annaDid)
      expect(verification.to).toBe(benDid)

      // Signature should be valid
      const isValid = await VerificationHelper.verifySignature(verification)
      expect(isValid).toBe(true)
    })
  })
})
