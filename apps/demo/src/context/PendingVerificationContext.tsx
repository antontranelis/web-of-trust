import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface PendingVerification {
  responseCode: string
  decoded: Record<string, string>
}

interface PendingVerificationContextType {
  pending: PendingVerification | null
  challengeNonce: string | null
  confettiKey: number
  toastMessage: string | null
  setPending: (p: PendingVerification | null) => void
  setChallengeNonce: (nonce: string | null) => void
  triggerConfetti: (message?: string) => void
}

const PendingVerificationContext = createContext<PendingVerificationContextType | null>(null)

export function PendingVerificationProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingVerification | null>(null)
  const [challengeNonce, setChallengeNonce] = useState<string | null>(null)
  const [confettiKey, setConfettiKey] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerConfetti = useCallback((message?: string) => {
    setConfettiKey(k => k + 1)
    setToastMessage(message ?? null)
  }, [])

  return (
    <PendingVerificationContext.Provider value={{ pending, setPending, challengeNonce, setChallengeNonce, confettiKey, toastMessage, triggerConfetti }}>
      {children}
    </PendingVerificationContext.Provider>
  )
}

export function usePendingVerification() {
  const ctx = useContext(PendingVerificationContext)
  if (!ctx) {
    throw new Error('usePendingVerification must be used within PendingVerificationProvider')
  }
  return ctx
}
