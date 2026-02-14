import type { Verification } from '@real-life/wot-core'

export interface VerificationResponsePayload {
  action: 'response'
  responseCode: string
  /** Bob's verification for Alice (from=Bob, to=Alice) — Empfänger-Prinzip */
  verification?: Verification
}

export interface VerificationCompletePayload {
  action: 'complete'
  verification: Verification
}

export type VerificationPayload =
  | VerificationResponsePayload
  | VerificationCompletePayload
