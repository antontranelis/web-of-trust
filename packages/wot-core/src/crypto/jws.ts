import { encodeBase64Url, decodeBase64Url } from './encoding'

/**
 * JWS (JSON Web Signature) utilities for signing and verifying data
 * Uses Ed25519 signatures via Web Crypto API
 *
 * JWS Compact Serialization Format (RFC 7515):
 * BASE64URL(UTF8(JWS Protected Header)) || '.' ||
 * BASE64URL(JWS Payload) || '.' ||
 * BASE64URL(JWS Signature)
 */

interface JwsHeader {
  alg: 'EdDSA'
  typ: 'JWT'
}

// Helper to convert Uint8Array to ArrayBuffer (for Web Crypto API compatibility)
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer
}

/**
 * Sign data and return JWS compact serialization
 *
 * @param payload - The data to sign (will be JSON stringified)
 * @param privateKey - CryptoKey for signing (Ed25519)
 * @returns JWS compact serialization string (header.payload.signature)
 */
export async function signJws(
  payload: unknown,
  privateKey: CryptoKey
): Promise<string> {
  // 1. Create JWS header
  const header: JwsHeader = {
    alg: 'EdDSA',
    typ: 'JWT',
  }

  // 2. Encode header and payload
  const encodedHeader = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  )
  const encodedPayload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  )

  // 3. Create signing input
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signingInputBytes = new TextEncoder().encode(signingInput)

  // 4. Sign with Ed25519
  const signatureBuffer = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    signingInputBytes
  )
  const signature = new Uint8Array(signatureBuffer)

  // 5. Encode signature
  const encodedSignature = encodeBase64Url(signature)

  // 6. Return JWS compact serialization
  return `${signingInput}.${encodedSignature}`
}

/**
 * Verify a JWS signature
 *
 * @param jws - JWS compact serialization string
 * @param publicKey - CryptoKey for verification (Ed25519)
 * @returns Object with verification result and decoded payload
 */
export async function verifyJws(
  jws: string,
  publicKey: CryptoKey
): Promise<{ valid: boolean; payload?: unknown; error?: string }> {
  try {
    // 1. Split JWS into parts
    const parts = jws.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWS format' }
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts

    // 2. Decode header
    const headerBytes = decodeBase64Url(encodedHeader)
    const header = JSON.parse(new TextDecoder().decode(headerBytes)) as JwsHeader

    // 3. Verify algorithm
    if (header.alg !== 'EdDSA') {
      return { valid: false, error: `Unsupported algorithm: ${header.alg}` }
    }

    // 4. Decode payload
    const payloadBytes = decodeBase64Url(encodedPayload)
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes))

    // 5. Decode signature
    const signature = decodeBase64Url(encodedSignature)

    // 6. Create signing input for verification
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const signingInputBytes = new TextEncoder().encode(signingInput)

    // 7. Verify signature
    const valid = await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      toArrayBuffer(signature),
      signingInputBytes
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
 * Extract payload from JWS without verifying signature
 * Useful for debugging or when signature verification happens separately
 */
export function extractJwsPayload(jws: string): unknown | null {
  try {
    const parts = jws.split('.')
    if (parts.length !== 3) return null

    const payloadBytes = decodeBase64Url(parts[1])
    return JSON.parse(new TextDecoder().decode(payloadBytes))
  } catch {
    return null
  }
}
