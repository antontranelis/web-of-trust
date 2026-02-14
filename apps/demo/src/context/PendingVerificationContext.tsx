import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Verification } from '@real-life/wot-core'

/** Incoming verification awaiting user confirmation (from QR scan). */
export interface PendingIncoming {
  verification: Verification
  fromDid: string
}

interface ConfettiContextType {
  confettiKey: number
  toastMessage: string | null
  triggerConfetti: (message?: string) => void
  challengeNonce: string | null
  setChallengeNonce: (nonce: string | null) => void
  pendingIncoming: PendingIncoming | null
  setPendingIncoming: (pending: PendingIncoming | null) => void
}

const ConfettiContext = createContext<ConfettiContextType | null>(null)

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const [confettiKey, setConfettiKey] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [challengeNonce, setChallengeNonce] = useState<string | null>(null)
  const [pendingIncoming, setPendingIncoming] = useState<PendingIncoming | null>(null)

  const triggerConfetti = useCallback((message?: string) => {
    setConfettiKey(k => k + 1)
    setToastMessage(message ?? null)
  }, [])

  return (
    <ConfettiContext.Provider value={{ confettiKey, toastMessage, triggerConfetti, challengeNonce, setChallengeNonce, pendingIncoming, setPendingIncoming }}>
      {children}
    </ConfettiContext.Provider>
  )
}

export function useConfetti() {
  const ctx = useContext(ConfettiContext)
  if (!ctx) {
    throw new Error('useConfetti must be used within ConfettiProvider')
  }
  return ctx
}

// Legacy alias — will be removed after all consumers are migrated
export const PendingVerificationProvider = ConfettiProvider
export const usePendingVerification = useConfetti
