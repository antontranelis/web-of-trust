import type { IdentitySession } from '../application'
import { VerificationWorkflow } from '../application'
import { WebCryptoProtocolCryptoAdapter } from '../protocol-adapters'
import type { Verification } from '../types/verification'

const workflow = new VerificationWorkflow({ crypto: new WebCryptoProtocolCryptoAdapter() })

/**
 * Compatibility facade for the verification application workflow.
 * New code should depend on `VerificationWorkflow` directly.
 */
export class VerificationHelper {
  static async createChallenge(identity: IdentitySession, name: string): Promise<string> {
    return (await workflow.createChallenge(identity, name)).code
  }

  static async respondToChallenge(challengeCode: string, identity: IdentitySession, name: string): Promise<string> {
    return (await workflow.createResponse(challengeCode, identity, name)).code
  }

  static async completeVerification(
    responseCode: string,
    identity: IdentitySession,
    expectedNonce: string,
  ): Promise<Verification> {
    return workflow.completeVerification(responseCode, identity, expectedNonce)
  }

  static async createVerificationFor(identity: IdentitySession, toDid: string, nonce: string): Promise<Verification> {
    return workflow.createVerificationFor(identity, toDid, nonce)
  }

  static async verifySignature(verification: Verification): Promise<boolean> {
    return workflow.verifySignature(verification)
  }

  static publicKeyFromDid(did: string): string {
    return workflow.publicKeyFromDid(did)
  }

  static multibaseToBytes(multibase: string): Uint8Array {
    return workflow.multibaseToBytes(multibase)
  }

  static base64UrlToBytes(base64url: string): Uint8Array {
    return workflow.base64UrlToBytes(base64url)
  }
}
