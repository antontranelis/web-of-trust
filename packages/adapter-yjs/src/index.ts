export {
  initYjsPersonalDoc,
  getYjsPersonalDoc,
  changeYjsPersonalDoc,
  onYjsPersonalDocChange,
  flushYjsPersonalDoc,
  resetYjsPersonalDoc,
} from './YjsPersonalDocManager'
export type { YjsPersonalDoc } from './YjsPersonalDocManager'

export { YjsPersonalSyncAdapter } from './YjsPersonalSyncAdapter'

export { YjsReplicationAdapter } from './YjsReplicationAdapter'
export type { YjsCompactStore } from './YjsReplicationAdapter'

// Re-export document types for consumers
export type {
  PersonalDoc,
  ProfileDoc,
  ContactDoc,
  VerificationDoc,
  AttestationDoc,
  AttestationMetadataDoc,
  OutboxEntryDoc,
  SpaceMetadataDoc,
  GroupKeyDoc,
} from './types'
