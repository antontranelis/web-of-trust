import type { StorageAdapter, CryptoAdapter } from '../adapters'
import type { Verification, VerificationChallenge, VerificationResponse, Identity, KeyPair } from '../types'

export class VerificationService {
  constructor(
    private storage: StorageAdapter,
    private crypto: CryptoAdapter
  ) {}

  async createChallenge(identity: Identity, keyPair: KeyPair): Promise<VerificationChallenge> {
    const publicKeyExported = await this.crypto.exportPublicKey(keyPair.publicKey)

    return {
      nonce: this.crypto.generateNonce(),
      timestamp: new Date().toISOString(),
      initiatorDid: identity.did,
      initiatorPublicKey: publicKeyExported,
      initiatorProfile: {
        name: identity.profile.name,
      },
    }
  }

  async createResponse(
    challenge: VerificationChallenge,
    identity: Identity,
    keyPair: KeyPair
  ): Promise<VerificationResponse> {
    const publicKeyExported = await this.crypto.exportPublicKey(keyPair.publicKey)

    // Sign the challenge data
    const challengeData = JSON.stringify({
      nonce: challenge.nonce,
      timestamp: challenge.timestamp,
      initiatorDid: challenge.initiatorDid,
    })
    const challengeSignature = await this.crypto.signString(challengeData, keyPair.privateKey)

    return {
      nonce: challenge.nonce,
      timestamp: new Date().toISOString(),
      responderDid: identity.did,
      responderPublicKey: publicKeyExported,
      responderProfile: {
        name: identity.profile.name,
      },
      challengeSignature,
    }
  }

  async verifyResponse(
    challenge: VerificationChallenge,
    response: VerificationResponse
  ): Promise<boolean> {
    // Verify the challenge signature
    const challengeData = JSON.stringify({
      nonce: challenge.nonce,
      timestamp: challenge.timestamp,
      initiatorDid: challenge.initiatorDid,
    })

    const responderPublicKey = await this.crypto.importPublicKey(response.responderPublicKey)

    return this.crypto.verifyString(challengeData, response.challengeSignature, responderPublicKey)
  }

  async completeVerification(
    challenge: VerificationChallenge,
    response: VerificationResponse,
    keyPair: KeyPair
  ): Promise<Verification> {
    // Verify the response first
    const isValid = await this.verifyResponse(challenge, response)
    if (!isValid) {
      throw new Error('Invalid verification response')
    }

    // Create verification record
    const verificationData = JSON.stringify({
      nonce: challenge.nonce,
      initiatorDid: challenge.initiatorDid,
      responderDid: response.responderDid,
      timestamp: response.timestamp,
    })

    const initiatorSignature = await this.crypto.signString(verificationData, keyPair.privateKey)

    const verification: Verification = {
      id: `ver-${challenge.nonce}`,
      initiatorDid: challenge.initiatorDid,
      responderDid: response.responderDid,
      initiatorSignature,
      responderSignature: response.challengeSignature,
      timestamp: response.timestamp,
    }

    await this.storage.addVerification(verification)

    return verification
  }

  async getVerifications(contactDid?: string): Promise<Verification[]> {
    return this.storage.getVerifications(contactDid)
  }

  async getVerification(id: string): Promise<Verification | null> {
    return this.storage.getVerification(id)
  }

  encodeChallenge(challenge: VerificationChallenge): string {
    return btoa(JSON.stringify(challenge))
  }

  decodeChallenge(encoded: string): VerificationChallenge {
    return JSON.parse(atob(encoded))
  }

  encodeResponse(response: VerificationResponse): string {
    return btoa(JSON.stringify(response))
  }

  decodeResponse(encoded: string): VerificationResponse {
    return JSON.parse(atob(encoded))
  }
}
