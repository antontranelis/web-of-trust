/**
 * Re-export from @real-life/wot-core.
 * The PersonalDocManager has been extracted to wot-core for reuse across apps.
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
} from '@real-life/wot-core'

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
} from '@real-life/wot-core'
