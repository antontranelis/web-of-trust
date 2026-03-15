/**
 * Re-export from @real-life/adapter-automerge.
 * The PersonalDocManager has been extracted to adapter-automerge for reuse across apps.
 */
export {
  initPersonalDoc,
  getPersonalDoc,
  isPersonalDocInitialized,
  changePersonalDoc,
  onPersonalDocChange,
  flushPersonalDoc,
  resetPersonalDoc,
  deletePersonalDocDB,
} from '@real-life/adapter-automerge'

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
} from '@real-life/adapter-automerge'
