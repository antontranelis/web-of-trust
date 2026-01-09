import type { StorageAdapter, CryptoAdapter } from '../adapters'
import type { Attestation, AttestationType, KeyPair } from '../types'

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
}
