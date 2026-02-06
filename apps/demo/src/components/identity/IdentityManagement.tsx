import { useState, useEffect } from 'react'
import { SecureWotIdentity } from '@real-life/wot-core'
import { OnboardingFlow } from './OnboardingFlow'
import { RecoveryFlow } from './RecoveryFlow'
import { UnlockFlow } from './UnlockFlow'

type Mode = 'checking' | 'unlock' | 'onboarding' | 'recovery'

interface IdentityManagementProps {
  onComplete: (identity: SecureWotIdentity, did: string) => void
}

export function IdentityManagement({ onComplete }: IdentityManagementProps) {
  const [mode, setMode] = useState<Mode>('checking')

  useEffect(() => {
    checkStoredIdentity()
  }, [])

  const checkStoredIdentity = async () => {
    try {
      const identity = new SecureWotIdentity()
      const hasSeed = await identity.hasStoredIdentity()

      if (hasSeed) {
        setMode('unlock')
      } else {
        setMode('onboarding')
      }
    } catch (error) {
      console.error('Error checking stored identity:', error)
      setMode('onboarding')
    }
  }

  if (mode === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Lade...</div>
      </div>
    )
  }

  if (mode === 'unlock') {
    return (
      <UnlockFlow
        onComplete={onComplete}
        onRecover={() => setMode('recovery')}
      />
    )
  }

  if (mode === 'recovery') {
    return (
      <RecoveryFlow
        onComplete={onComplete}
        onCancel={() => setMode('unlock')}
      />
    )
  }

  // mode === 'onboarding'
  return (
    <OnboardingFlow
      onComplete={onComplete}
    />
  )
}
