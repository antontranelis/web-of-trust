import type { Profile } from './identity'

export type ContactStatus = 'pending' | 'verified' | 'hidden'

export interface Contact {
  did: string
  profile: Profile
  status: ContactStatus
  verifiedAt?: string
  hiddenAt?: string
  createdAt: string
  updatedAt: string
}
