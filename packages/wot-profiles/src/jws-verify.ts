/**
 * Standalone JWS verification for wot-profiles.
 * No dependency on wot-core — self-contained Ed25519 + did:key verification.
 */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function decodeBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function decodeBase58(input: string): Uint8Array {
  let num = BigInt(0)
  for (const char of input) {
    const index = BASE58_ALPHABET.indexOf(char)
    if (index === -1) throw new Error(`Invalid Base58 character: ${char}`)
    num = num * BigInt(58) + BigInt(index)
  }

  const hex = num.toString(16).padStart(2, '0')
  const hexPadded = hex.length % 2 ? '0' + hex : hex
  const bytes: number[] = []
  for (let i = 0; i < hexPadded.length; i += 2) {
    bytes.push(parseInt(hexPadded.slice(i, i + 2), 16))
  }

  // Handle leading zeros
  let leadingZeros = 0
  for (const char of input) {
    if (char === '1') leadingZeros++
    else break
  }

  return new Uint8Array([...new Array(leadingZeros).fill(0), ...bytes])
}

function didToPublicKeyBytes(did: string): Uint8Array {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Invalid did:key format')
  }
  const multibase = did.slice('did:key:z'.length)
  const prefixedKey = decodeBase58(multibase)

  // Verify Ed25519 multicodec prefix (0xed, 0x01)
  if (prefixedKey[0] !== 0xed || prefixedKey[1] !== 0x01) {
    throw new Error('Invalid multicodec prefix for Ed25519')
  }

  return prefixedKey.slice(2)
}

export interface JwsVerifyResult {
  valid: boolean
  payload?: Record<string, unknown>
  error?: string
}

/**
 * Verify a JWS and extract the DID from the payload.
 * Returns the DID that signed the JWS if valid.
 */
export async function verifyProfileJws(jws: string): Promise<JwsVerifyResult> {
  try {
    const parts = jws.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWS format' }
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts

    // Decode header
    const headerBytes = decodeBase64Url(encodedHeader)
    const header = JSON.parse(new TextDecoder().decode(headerBytes))
    if (header.alg !== 'EdDSA') {
      return { valid: false, error: `Unsupported algorithm: ${header.alg}` }
    }

    // Decode payload
    const payloadBytes = decodeBase64Url(encodedPayload)
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes))

    if (!payload.did || typeof payload.did !== 'string') {
      return { valid: false, error: 'Missing DID in payload' }
    }

    // Resolve public key from DID
    const publicKeyBytes = didToPublicKeyBytes(payload.did)
    const publicKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(publicKeyBytes),
      { name: 'Ed25519' },
      true,
      ['verify'],
    )

    // Decode signature
    const signature = decodeBase64Url(encodedSignature)

    // Verify
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const valid = await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      new Uint8Array(signature),
      new TextEncoder().encode(signingInput),
    )

    return { valid, payload }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    }
  }
}

/**
 * Extract payload from JWS without verifying.
 */
export function extractJwsPayload(jws: string): Record<string, unknown> | null {
  try {
    const parts = jws.split('.')
    if (parts.length !== 3) return null
    const payloadBytes = decodeBase64Url(parts[1])
    return JSON.parse(new TextDecoder().decode(payloadBytes))
  } catch {
    return null
  }
}
