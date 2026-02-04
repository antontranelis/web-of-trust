import type {
  StorageAdapter,
  CryptoAdapter,
  Verification,
  VerificationChallenge,
  VerificationResponse,
  Identity,
  KeyPair,
  Proof,
} from '@real-life/wot-core'

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
      fromDid: identity.did,
      fromPublicKey: publicKeyExported,
      fromName: identity.profile.name,
    }
  }

  async createResponse(
    challenge: VerificationChallenge,
    identity: Identity,
    keyPair: KeyPair
  ): Promise<VerificationResponse> {
    const publicKeyExported = await this.crypto.exportPublicKey(keyPair.publicKey)

    return {
      nonce: challenge.nonce,
      timestamp: new Date().toISOString(),
      toDid: identity.did,
      toPublicKey: publicKeyExported,
      toName: identity.profile.name,
    }
  }

  /**
   * Complete verification (Empfänger-Prinzip)
   * Creates a Verification that will be stored at the recipient (to)
   */
  async completeVerification(
    challenge: VerificationChallenge,
    response: VerificationResponse,
    keyPair: KeyPair
  ): Promise<Verification> {
    const timestamp = new Date().toISOString()

    // Create verification: challenge.from verifies response.to
    // Stored at response.to (the recipient of this verification)
    const verificationData = JSON.stringify({
      nonce: challenge.nonce,
      from: challenge.fromDid,
      to: response.toDid,
      timestamp,
    })

    const signature = await this.crypto.signString(verificationData, keyPair.privateKey)

    const proof: Proof = {
      type: 'Ed25519Signature2020',
      verificationMethod: `${challenge.fromDid}#key-1`,
      created: timestamp,
      proofPurpose: 'authentication',
      proofValue: signature,
    }

    const verification: Verification = {
      id: `urn:uuid:ver-${challenge.nonce}`,
      from: challenge.fromDid,
      to: response.toDid,
      timestamp,
      proof,
    }

    // Store at recipient (this is our own verification we receive)
    await this.storage.saveVerification(verification)

    return verification
  }

  async getReceivedVerifications(): Promise<Verification[]> {
    return this.storage.getReceivedVerifications()
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
