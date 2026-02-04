import type {
  StorageAdapter,
  CryptoAdapter,
  Attestation,
  KeyPair,
  Proof,
} from '@real-life/wot-core'

export class AttestationService {
  constructor(
    private storage: StorageAdapter,
    private crypto: CryptoAdapter
  ) {}

  /**
   * Create an attestation (as the sender/from)
   * Note: In a real app, this would be sent to the recipient for storage
   * For demo purposes, we store it locally
   */
  async createAttestation(
    fromDid: string,
    toDid: string,
    claim: string,
    keyPair: KeyPair,
    tags?: string[]
  ): Promise<Attestation> {
    const id = `urn:uuid:${this.crypto.generateNonce().slice(0, 8)}-${Date.now()}`
    const createdAt = new Date().toISOString()

    // Create data to sign (without proof)
    const dataToSign = JSON.stringify({
      id,
      from: fromDid,
      to: toDid,
      claim,
      tags,
      createdAt,
    })

    const signature = await this.crypto.signString(dataToSign, keyPair.privateKey)

    const proof: Proof = {
      type: 'Ed25519Signature2020',
      verificationMethod: `${fromDid}#key-1`,
      created: createdAt,
      proofPurpose: 'assertionMethod',
      proofValue: signature,
    }

    const attestation: Attestation = {
      id,
      from: fromDid,
      to: toDid,
      claim,
      tags,
      createdAt,
      proof,
    }

    // In Empfänger-Prinzip, attestations are stored at the recipient
    // For demo, we store locally (simulating receiving an attestation)
    await this.storage.saveAttestation(attestation)

    return attestation
  }

  async verifyAttestation(attestation: Attestation): Promise<boolean> {
    const dataToVerify = JSON.stringify({
      id: attestation.id,
      from: attestation.from,
      to: attestation.to,
      claim: attestation.claim,
      tags: attestation.tags,
      createdAt: attestation.createdAt,
    })

    const fromPublicKey = await this.crypto.didToPublicKey(attestation.from)

    return this.crypto.verifyString(dataToVerify, attestation.proof.proofValue, fromPublicKey)
  }

  /**
   * Get all attestations I've received (stored locally)
   */
  async getReceivedAttestations(): Promise<Attestation[]> {
    return this.storage.getReceivedAttestations()
  }

  async getAttestation(id: string): Promise<Attestation | null> {
    return this.storage.getAttestation(id)
  }

  /**
   * Accept or reject an attestation
   */
  async setAttestationAccepted(attestationId: string, accepted: boolean): Promise<void> {
    await this.storage.setAttestationAccepted(attestationId, accepted)
  }

  async importAttestation(encoded: string): Promise<Attestation> {
    // Decode base64
    let attestation: Attestation
    try {
      const decoded = atob(encoded.trim())
      attestation = JSON.parse(decoded)
    } catch {
      throw new Error('Ungültiges Format. Bitte einen gültigen Attestation-Code einfügen.')
    }

    // Validate required fields
    if (!attestation.id || !attestation.from || !attestation.to ||
        !attestation.claim || !attestation.proof || !attestation.createdAt) {
      throw new Error('Unvollständige Attestation. Erforderliche Felder fehlen.')
    }

    // Check if already exists
    const existing = await this.storage.getAttestation(attestation.id)
    if (existing) {
      throw new Error('Diese Attestation existiert bereits.')
    }

    // Verify signature
    const isValid = await this.verifyAttestation(attestation)
    if (!isValid) {
      throw new Error('Ungültige Signatur. Die Attestation konnte nicht verifiziert werden.')
    }

    // Save to storage
    await this.storage.saveAttestation(attestation)

    return attestation
  }
}
