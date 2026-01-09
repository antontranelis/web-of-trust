import type {
  StorageAdapter,
  CryptoAdapter,
  Attestation,
  AttestationType,
  KeyPair,
} from '@web-of-trust/core'

export class AttestationService {
  constructor(
    private storage: StorageAdapter,
    private crypto: CryptoAdapter
  ) {}

  async createAttestation(
    issuerDid: string,
    subjectDid: string,
    type: AttestationType,
    content: string,
    keyPair: KeyPair,
    tags?: string[]
  ): Promise<Attestation> {
    const id = `att-${this.crypto.generateNonce().slice(0, 16)}`
    const createdAt = new Date().toISOString()

    // Create data to sign
    const dataToSign = JSON.stringify({
      id,
      type,
      issuerDid,
      subjectDid,
      content,
      tags,
      createdAt,
    })

    const signature = await this.crypto.signString(dataToSign, keyPair.privateKey)

    const attestation: Attestation = {
      id,
      type,
      issuerDid,
      subjectDid,
      content,
      tags,
      signature,
      createdAt,
    }

    await this.storage.addAttestation(attestation)

    return attestation
  }

  async verifyAttestation(attestation: Attestation): Promise<boolean> {
    const dataToVerify = JSON.stringify({
      id: attestation.id,
      type: attestation.type,
      issuerDid: attestation.issuerDid,
      subjectDid: attestation.subjectDid,
      content: attestation.content,
      tags: attestation.tags,
      createdAt: attestation.createdAt,
    })

    const issuerPublicKey = await this.crypto.didToPublicKey(attestation.issuerDid)

    return this.crypto.verifyString(dataToVerify, attestation.signature, issuerPublicKey)
  }

  async getAttestations(issuerDid?: string): Promise<Attestation[]> {
    return this.storage.getAttestations(issuerDid)
  }

  async getAttestationsAbout(subjectDid: string): Promise<Attestation[]> {
    return this.storage.getAttestationsAbout(subjectDid)
  }

  async getAttestation(id: string): Promise<Attestation | null> {
    return this.storage.getAttestation(id)
  }

  async getAttestationsByType(type: AttestationType): Promise<Attestation[]> {
    const all = await this.storage.getAttestations()
    return all.filter((a) => a.type === type)
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
    if (!attestation.id || !attestation.issuerDid || !attestation.subjectDid ||
        !attestation.content || !attestation.signature || !attestation.createdAt) {
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
    await this.storage.addAttestation(attestation)

    return attestation
  }
}
