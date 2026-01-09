import type { CryptoAdapter } from '../interfaces/CryptoAdapter'
import type { KeyPair } from '../../types'
import { encodeBase64Url, decodeBase64Url } from '../../crypto/encoding'
import { createDid, didToPublicKeyBytes } from '../../crypto/did'

// Helper to convert Uint8Array to ArrayBuffer (workaround for TypeScript strict mode)
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer
}

export class WebCryptoAdapter implements CryptoAdapter {
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    ) as CryptoKeyPair
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
  }

  async exportKeyPair(keyPair: KeyPair): Promise<{ publicKey: string; privateKey: string }> {
    const [publicKeyRaw, privateKeyRaw] = await Promise.all([
      crypto.subtle.exportKey('raw', keyPair.publicKey),
      crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    ])
    return {
      publicKey: encodeBase64Url(new Uint8Array(publicKeyRaw)),
      privateKey: encodeBase64Url(new Uint8Array(privateKeyRaw)),
    }
  }

  async importKeyPair(exported: { publicKey: string; privateKey: string }): Promise<KeyPair> {
    const pubBytes = decodeBase64Url(exported.publicKey)
    const privBytes = decodeBase64Url(exported.privateKey)
    const [publicKey, privateKey] = await Promise.all([
      crypto.subtle.importKey(
        'raw',
        toBuffer(pubBytes),
        { name: 'Ed25519' },
        true,
        ['verify']
      ),
      crypto.subtle.importKey(
        'pkcs8',
        toBuffer(privBytes),
        { name: 'Ed25519' },
        true,
        ['sign']
      ),
    ])
    return { publicKey, privateKey }
  }

  async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey('raw', publicKey)
    return encodeBase64Url(new Uint8Array(raw))
  }

  async importPublicKey(exported: string): Promise<CryptoKey> {
    const bytes = decodeBase64Url(exported)
    return crypto.subtle.importKey(
      'raw',
      toBuffer(bytes),
      { name: 'Ed25519' },
      true,
      ['verify']
    )
  }

  async createDid(publicKey: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey('raw', publicKey)
    return createDid(new Uint8Array(raw))
  }

  async didToPublicKey(did: string): Promise<CryptoKey> {
    const publicKeyBytes = didToPublicKeyBytes(did)
    return crypto.subtle.importKey(
      'raw',
      toBuffer(publicKeyBytes),
      { name: 'Ed25519' },
      true,
      ['verify']
    )
  }

  async sign(data: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      privateKey,
      toBuffer(data)
    )
    return new Uint8Array(signature)
  }

  async verify(data: Uint8Array, signature: Uint8Array, publicKey: CryptoKey): Promise<boolean> {
    return crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      toBuffer(signature),
      toBuffer(data)
    )
  }

  async signString(data: string, privateKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder()
    const signature = await this.sign(encoder.encode(data), privateKey)
    return encodeBase64Url(signature)
  }

  async verifyString(data: string, signature: string, publicKey: CryptoKey): Promise<boolean> {
    const encoder = new TextEncoder()
    return this.verify(encoder.encode(data), decodeBase64Url(signature), publicKey)
  }

  generateNonce(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return encodeBase64Url(bytes)
  }

  async hashData(data: Uint8Array): Promise<Uint8Array> {
    const hash = await crypto.subtle.digest('SHA-256', toBuffer(data))
    return new Uint8Array(hash)
  }
}
