import type { ProtocolCryptoAdapter } from '../crypto/ports'
import { decodeJws } from '../crypto/jws'
import type { DidDocument, DidResolver } from '../identity/did-document'
import { didOrKidToDid, ed25519MultibaseToPublicKeyBytes } from '../identity/did-key'

export interface ProfileServiceResourcePayload {
  did: string
  version: number
  didDocument: DidDocument
  profile: {
    name: string
    [key: string]: unknown
  }
  updatedAt: string
}

export interface ValidateProfileServiceResourcePayloadOptions {
  expectedDid: string
}

export interface VerifyProfileServiceResourceJwsOptions extends ValidateProfileServiceResourcePayloadOptions {
  didResolver: DidResolver
  crypto: ProtocolCryptoAdapter
}

export interface ProfileResourcePutAcceptanceOptions {
  incomingVersion: number
  storedVersion?: number
}

export type ProfileResourcePutAcceptance =
  | { accept: true }
  | { accept: false; conflictVersion: number }

export interface ProfileResourceRollbackOptions {
  fetchedVersion: number
  lastSeenVersion?: number
}

export function validateProfileServiceResourcePayload(
  payload: unknown,
  options: ValidateProfileServiceResourcePayloadOptions,
): ProfileServiceResourcePayload {
  const record = assertRecord(payload, 'Invalid profile resource payload')
  assertNoExtraKeys(record, ['did', 'version', 'didDocument', 'profile', 'updatedAt'], 'profile resource payload')

  if (typeof record.did !== 'string' || !/^did:[a-z0-9]+:.+/.test(record.did)) {
    throw new Error('Invalid profile resource DID')
  }
  if (record.did !== options.expectedDid) throw new Error('Profile resource DID does not match path DID')
  if (!Number.isInteger(record.version) || (record.version as number) < 0) {
    throw new Error('Invalid profile resource version')
  }

  const didDocument = assertRecord(record.didDocument, 'Invalid profile resource DID document')
  if (didDocument.id !== record.did) throw new Error('Profile resource DID document id does not match payload DID')

  const profile = assertRecord(record.profile, 'Invalid profile resource profile metadata')
  if (typeof profile.name !== 'string' || profile.name.length === 0) {
    throw new Error('Invalid profile resource profile name')
  }
  if (Object.prototype.hasOwnProperty.call(profile, 'encryptionPublicKey')) {
    throw new Error('Profile resource profile metadata must not contain encryptionPublicKey')
  }

  if (typeof record.updatedAt !== 'string') throw new Error('Invalid profile resource updatedAt')

  return record as unknown as ProfileServiceResourcePayload
}

export function decideProfileResourcePutAcceptance(
  options: ProfileResourcePutAcceptanceOptions,
): ProfileResourcePutAcceptance {
  assertVersion(options.incomingVersion, 'incoming profile resource version')
  if (options.storedVersion === undefined) return { accept: true }
  assertVersion(options.storedVersion, 'stored profile resource version')
  if (options.incomingVersion > options.storedVersion) return { accept: true }
  return { accept: false, conflictVersion: options.storedVersion }
}

export function detectProfileResourceRollback(options: ProfileResourceRollbackOptions): boolean {
  assertVersion(options.fetchedVersion, 'fetched profile resource version')
  if (options.lastSeenVersion === undefined) return false
  assertVersion(options.lastSeenVersion, 'last seen profile resource version')
  return options.fetchedVersion < options.lastSeenVersion
}

export async function verifyProfileServiceResourceJws(
  jws: string,
  options: VerifyProfileServiceResourceJwsOptions,
): Promise<ProfileServiceResourcePayload> {
  const decoded = decodeJws(jws)
  const header = assertRecord(decoded.header, 'Invalid JWS header')
  if (header.alg !== 'EdDSA') throw new Error('Unsupported JWS alg')
  if (typeof header.kid !== 'string' || header.kid.length === 0) throw new Error('Missing JWS kid')

  const payload = validateProfileServiceResourcePayload(decoded.payload, { expectedDid: options.expectedDid })
  if (didOrKidToDid(header.kid) !== payload.did) throw new Error('Profile resource JWS kid DID does not match payload DID')

  const publicKey = await resolveVerificationPublicKey(header.kid, options.didResolver)
  const valid = await options.crypto.verifyEd25519(decoded.signingInput, decoded.signature, publicKey)
  if (!valid) throw new Error('Invalid JWS signature')
  return payload
}

async function resolveVerificationPublicKey(kid: string, didResolver: DidResolver): Promise<Uint8Array> {
  const did = didOrKidToDid(kid)
  const didDocument = await didResolver.resolve(did)
  if (!didDocument) throw new Error('Unable to resolve profile resource DID')

  const verificationMethod = didDocument.verificationMethod.find((method) => method.id === kid || `${did}${method.id}` === kid)
  if (!verificationMethod) throw new Error('Unable to resolve profile resource verification method')
  return ed25519MultibaseToPublicKeyBytes(verificationMethod.publicKeyMultibase)
}

function assertRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(message)
  return value as Record<string, unknown>
}

function assertNoExtraKeys(value: Record<string, unknown>, allowed: string[], name: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`Invalid ${name} property: ${key}`)
  }
}

function assertVersion(value: unknown, name: string): void {
  if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`Invalid ${name}`)
}
