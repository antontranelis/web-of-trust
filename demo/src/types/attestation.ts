export type AttestationType =
  | 'skill'
  | 'help'
  | 'collaboration'
  | 'recommendation'
  | 'custom'

export interface Attestation {
  id: string
  type: AttestationType
  issuerDid: string
  subjectDid: string
  content: string
  tags?: string[]
  signature: string
  createdAt: string
}
