import type { KeyPair } from '../../types'

export interface CryptoAdapter {
  // Key Management
  generateKeyPair(): Promise<KeyPair>
  exportKeyPair(keyPair: KeyPair): Promise<{ publicKey: string; privateKey: string }>
  importKeyPair(exported: { publicKey: string; privateKey: string }): Promise<KeyPair>
  exportPublicKey(publicKey: CryptoKey): Promise<string>
  importPublicKey(exported: string): Promise<CryptoKey>

  // DID
  createDid(publicKey: CryptoKey): Promise<string>
  didToPublicKey(did: string): Promise<CryptoKey>

  // Signing
  sign(data: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array>
  verify(data: Uint8Array, signature: Uint8Array, publicKey: CryptoKey): Promise<boolean>
  signString(data: string, privateKey: CryptoKey): Promise<string>
  verifyString(data: string, signature: string, publicKey: CryptoKey): Promise<boolean>

  // Utilities
  generateNonce(): string
  hashData(data: Uint8Array): Promise<Uint8Array>
}
