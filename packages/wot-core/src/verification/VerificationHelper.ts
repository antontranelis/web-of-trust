import type { WotIdentity } from '../identity/WotIdentity'
import type {
  VerificationChallenge,
  VerificationResponse,
  Verification,
} from '../types/verification'
import { base58 } from '@scure/base'

/**
 * VerificationHelper - Utilities for in-person verification flow
 *
 * Implements challenge-response protocol with Ed25519 signatures.
 */
export class VerificationHelper {
  /**
   * Create a verification challenge
   *
   * @param identity - WotIdentity of challenger
   * @param name - Display name of challenger
   * @returns Base64-encoded challenge string
   */
  static async createChallenge(identity: WotIdentity, name: string): Promise<string> {
    const challenge: VerificationChallenge = {
      nonce: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      fromDid: identity.getDid(),
      fromPublicKey: await identity.getPublicKeyMultibase(),
      fromName: name,
    }

    return btoa(JSON.stringify(challenge))
  }

  /**
   * Respond to a verification challenge
   *
   * @param challengeCode - Base64-encoded challenge
   * @param identity - WotIdentity of responder
   * @param name - Display name of responder
   * @returns Base64-encoded response string
   */
  static async respondToChallenge(
    challengeCode: string,
    identity: WotIdentity,
    name: string
  ): Promise<string> {
    const challenge: VerificationChallenge = JSON.parse(atob(challengeCode))

    const response: VerificationResponse = {
      nonce: challenge.nonce,
      timestamp: new Date().toISOString(),
      // Responder info
      toDid: identity.getDid(),
      toPublicKey: await identity.getPublicKeyMultibase(),
      toName: name,
      // Original challenge info
      fromDid: challenge.fromDid,
      fromPublicKey: challenge.fromPublicKey,
      fromName: challenge.fromName,
    }

    return btoa(JSON.stringify(response))
  }

  /**
   * Complete verification by creating signed verification object
   *
   * @param responseCode - Base64-encoded response
   * @param identity - WotIdentity of initiator (signer)
   * @param expectedNonce - Nonce from original challenge
   * @returns Signed Verification object
   * @throws Error if nonce mismatch
   */
  static async completeVerification(
    responseCode: string,
    identity: WotIdentity,
    expectedNonce: string
  ): Promise<Verification> {
    const response: VerificationResponse = JSON.parse(atob(responseCode))

    // Validate nonce
    if (response.nonce !== expectedNonce) {
      throw new Error('Nonce mismatch')
    }

    // Create verification data to sign
    const verificationData = JSON.stringify({
      from: identity.getDid(),
      to: response.toDid,
      timestamp: response.timestamp,
    })

    // Sign with initiator's identity
    const signature = await identity.sign(verificationData)

    const verification: Verification = {
      id: `urn:uuid:ver-${response.nonce}`,
      from: identity.getDid(),
      to: response.toDid,
      timestamp: response.timestamp,
      proof: {
        type: 'Ed25519Signature2020',
        verificationMethod: `${identity.getDid()}#key-1`,
        created: new Date().toISOString(),
        proofPurpose: 'authentication',
        proofValue: signature,
      },
    }

    return verification
  }

  /**
   * Create a verification for a specific DID (Empfänger-Prinzip).
   * Used when Bob verifies Alice: from=Bob, to=Alice.
   *
   * @param identity - WotIdentity of the signer (from)
   * @param toDid - DID of the person being verified (to/recipient)
   * @param nonce - Nonce from the challenge for deterministic ID
   * @returns Signed Verification object
   */
  static async createVerificationFor(
    identity: WotIdentity,
    toDid: string,
    nonce: string
  ): Promise<Verification> {
    const timestamp = new Date().toISOString()

    const verificationData = JSON.stringify({
      from: identity.getDid(),
      to: toDid,
      timestamp,
    })

    const signature = await identity.sign(verificationData)

    return {
      id: `urn:uuid:ver-${nonce}-${identity.getDid().slice(-8)}`,
      from: identity.getDid(),
      to: toDid,
      timestamp,
      proof: {
        type: 'Ed25519Signature2020',
        verificationMethod: `${identity.getDid()}#key-1`,
        created: timestamp,
        proofPurpose: 'authentication',
        proofValue: signature,
      },
    }
  }

  /**
   * Verify signature on a verification object
   *
   * @param verification - Verification object to verify
   * @returns True if signature is valid
   */
  static async verifySignature(verification: Verification): Promise<boolean> {
    try {
      // Extract public key from DID
      const publicKeyMultibase = this.publicKeyFromDid(verification.from)

      // Recreate signed data
      const verificationData = JSON.stringify({
        from: verification.from,
        to: verification.to,
        timestamp: verification.timestamp,
      })

      // Convert multibase to bytes
      const publicKeyBytes = this.multibaseToBytes(publicKeyMultibase)

      // Import public key
      const publicKey = await crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        'Ed25519',
        false,
        ['verify']
      )

      // Decode signature from base64url
      const signatureBytes = this.base64UrlToBytes(verification.proof.proofValue)

      // Verify signature
      const encoder = new TextEncoder()
      const isValid = await crypto.subtle.verify(
        'Ed25519',
        publicKey,
        signatureBytes,
        encoder.encode(verificationData)
      )

      return isValid
    } catch (error) {
      console.error('Signature verification failed:', error)
      return false
    }
  }

  /**
   * Extract public key from did:key DID
   *
   * @param did - DID in format did:key:z6Mk...
   * @returns Multibase-encoded public key (z6Mk...)
   */
  static publicKeyFromDid(did: string): string {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid did:key format')
    }

    return did.slice(8) // Remove 'did:key:' prefix
  }

  /**
   * Convert multibase (base58btc) to bytes
   *
   * @param multibase - Multibase string (z-prefixed base58btc)
   * @returns Uint8Array of decoded bytes
   */
  static multibaseToBytes(multibase: string): Uint8Array {
    if (!multibase.startsWith('z')) {
      throw new Error('Only base58btc (z-prefix) multibase supported')
    }

    // Remove 'z' prefix and decode base58btc
    const base58String = multibase.slice(1)
    const decoded = base58.decode(base58String)

    // did:key format for Ed25519 has 2-byte prefix (0xed01) before the 32-byte key
    // Skip the prefix to get the raw public key
    if (decoded.length === 34 && decoded[0] === 0xed && decoded[1] === 0x01) {
      return decoded.slice(2)
    }

    throw new Error('Invalid Ed25519 public key format in multibase')
  }

  /**
   * Convert base64url to bytes
   *
   * @param base64url - Base64url-encoded string
   * @returns Uint8Array of decoded bytes
   */
  static base64UrlToBytes(base64url: string): Uint8Array {
    // Convert base64url to base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')

    // Decode base64
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes
  }
}
