// Types
export type {
  Profile,
  Identity,
  KeyPair,
} from './types/identity'

export type {
  Contact,
  ContactStatus,
} from './types/contact'

export type {
  Verification,
  GeoLocation,
  VerificationChallenge,
  VerificationResponse,
} from './types/verification'

export type {
  Attestation,
  AttestationMetadata,
} from './types/attestation'

export type { Proof } from './types/proof'

// Adapter Interfaces
export type { StorageAdapter } from './adapters/interfaces/StorageAdapter'
export type {
  CryptoAdapter,
  EncryptedPayload,
} from './adapters/interfaces/CryptoAdapter'
export type {
  SyncAdapter,
  SyncState,
  SyncChange,
} from './adapters/interfaces/SyncAdapter'
export { NoOpSyncAdapter } from './adapters/interfaces/SyncAdapter'

// Crypto Utilities
export {
  encodeBase58,
  decodeBase58,
  encodeBase64Url,
  decodeBase64Url,
} from './crypto/encoding'

export {
  createDid,
  didToPublicKeyBytes,
  isValidDid,
  getDefaultDisplayName,
} from './crypto/did'

export {
  signJws,
  verifyJws,
  extractJwsPayload,
} from './crypto/jws'

// Identity
export { SecureWotIdentity } from './identity'

// Adapter Implementations
export { WebCryptoAdapter } from './adapters/crypto/WebCryptoAdapter'
export { LocalStorageAdapter } from './adapters/storage/LocalStorageAdapter'
