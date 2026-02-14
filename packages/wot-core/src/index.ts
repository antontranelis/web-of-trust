// Types
export type {
  Profile,
  Identity,
  KeyPair,
  PublicProfile,
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

export type {
  ResourceType,
  ResourceRef,
} from './types/resource-ref'

export {
  createResourceRef,
  parseResourceRef,
} from './types/resource-ref'

export type {
  MessageType,
  MessageEnvelope,
  DeliveryReceipt,
  MessagingState,
} from './types/messaging'

export type {
  SpaceInfo,
  SpaceMemberChange,
  ReplicationState,
} from './types/space'

// Adapter Interfaces
export type { StorageAdapter } from './adapters/interfaces/StorageAdapter'
export type {
  CryptoAdapter,
  EncryptedPayload,
} from './adapters/interfaces/CryptoAdapter'
export type { Subscribable } from './adapters/interfaces/Subscribable'
export type { ReactiveStorageAdapter } from './adapters/interfaces/ReactiveStorageAdapter'
export type { MessagingAdapter } from './adapters/interfaces/MessagingAdapter'
export type {
  DiscoveryAdapter,
  PublicVerificationsData,
  PublicAttestationsData,
} from './adapters/interfaces/DiscoveryAdapter'
export type { ReplicationAdapter, SpaceHandle } from './adapters/interfaces/ReplicationAdapter'
export type { DiscoverySyncStore, DiscoverySyncField } from './adapters/interfaces/DiscoverySyncStore'

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
export { WotIdentity } from './identity'

// Verification
export { VerificationHelper } from './verification'

// Services
export { ProfileService } from './services/ProfileService'
export { EncryptedSyncService } from './services/EncryptedSyncService'
export { GroupKeyService } from './services/GroupKeyService'

// Adapter Implementations
export { WebCryptoAdapter } from './adapters/crypto/WebCryptoAdapter'
export { LocalStorageAdapter } from './adapters/storage/LocalStorageAdapter'
export { InMemoryMessagingAdapter } from './adapters/messaging/InMemoryMessagingAdapter'
export { WebSocketMessagingAdapter } from './adapters/messaging/WebSocketMessagingAdapter'
export { AutomergeReplicationAdapter } from './adapters/replication/AutomergeReplicationAdapter'
export { HttpDiscoveryAdapter } from './adapters/discovery/HttpDiscoveryAdapter'
export { OfflineFirstDiscoveryAdapter } from './adapters/discovery/OfflineFirstDiscoveryAdapter'
export { InMemoryDiscoverySyncStore } from './adapters/discovery/InMemoryDiscoverySyncStore'
