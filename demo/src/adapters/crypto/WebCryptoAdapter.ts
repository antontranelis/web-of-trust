import type { CryptoAdapter } from '../interfaces/CryptoAdapter'
import type { KeyPair } from '../../types'

// Base58 alphabet (Bitcoin style, no 0, O, I, l)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function encodeBase58(bytes: Uint8Array): string {
  const digits = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8
      digits[i] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  // Handle leading zeros
  let output = ''
  for (const byte of bytes) {
    if (byte === 0) output += BASE58_ALPHABET[0]
    else break
  }
  // Convert digits to string (reverse order)
  for (let i = digits.length - 1; i >= 0; i--) {
    output += BASE58_ALPHABET[digits[i]]
  }
  return output
}

function decodeBase58(str: string): Uint8Array {
  const bytes = [0]
  for (const char of str) {
    const value = BASE58_ALPHABET.indexOf(char)
    if (value < 0) throw new Error(`Invalid base58 character: ${char}`)
    let carry = value
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  // Handle leading '1's (zeros)
  for (const char of str) {
    if (char === BASE58_ALPHABET[0]) bytes.push(0)
    else break
  }
  return new Uint8Array(bytes.reverse())
}

function encodeBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (padded.length % 4)) % 4
  const base64 = padded + '='.repeat(padding)
  const binary = atob(base64)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

// Helper to convert Uint8Array to ArrayBuffer (workaround for TypeScript strict mode)
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer
}

// Multicodec prefixes
const ED25519_PUB_PREFIX = new Uint8Array([0xed, 0x01])

export class WebCryptoAdapter implements CryptoAdapter {
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    )
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
    const publicKeyBytes = new Uint8Array(raw)

    // Create multicodec-prefixed key
    const prefixedKey = new Uint8Array(ED25519_PUB_PREFIX.length + publicKeyBytes.length)
    prefixedKey.set(ED25519_PUB_PREFIX)
    prefixedKey.set(publicKeyBytes, ED25519_PUB_PREFIX.length)

    // Encode as base58btc with 'z' prefix for did:key
    const multibase = 'z' + encodeBase58(prefixedKey)

    return `did:key:${multibase}`
  }

  async didToPublicKey(did: string): Promise<CryptoKey> {
    if (!did.startsWith('did:key:z')) {
      throw new Error('Invalid did:key format')
    }

    const multibase = did.slice('did:key:z'.length)
    const prefixedKey = decodeBase58(multibase)

    // Verify prefix
    if (prefixedKey[0] !== ED25519_PUB_PREFIX[0] || prefixedKey[1] !== ED25519_PUB_PREFIX[1]) {
      throw new Error('Invalid multicodec prefix for Ed25519')
    }

    const publicKeyBytes = prefixedKey.slice(ED25519_PUB_PREFIX.length)

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
