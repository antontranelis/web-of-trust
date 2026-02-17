import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { WotIdentity } from '@real-life/wot-core'
import { useLanguage } from '../../i18n'

interface UnlockFlowProps {
  onComplete: (identity: WotIdentity, did: string) => void
  onRecover: () => void
}

export function UnlockFlow({ onComplete, onRecover }: UnlockFlowProps) {
  const { t } = useLanguage()
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUnlock = async () => {
    if (!passphrase) {
      setError(t.unlock.errorNoPassword)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const identity = new WotIdentity()
      await identity.unlockFromStorage(passphrase)

      const did = identity.getDid()
      onComplete(identity, did)
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('Invalid passphrase')) {
          setError(t.unlock.errorWrongPassword)
        } else if (e.message.includes('No stored seed')) {
          setError(t.unlock.errorNoIdentity)
        } else {
          setError(e.message)
        }
      } else {
        setError(t.unlock.errorGeneric)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && passphrase) {
      handleUnlock()
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.unlock.title}
          </h1>
          <p className="text-slate-600">
            {t.unlock.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.unlock.passwordLabel}
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.unlock.passwordPlaceholder}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassphrase ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={isLoading || !passphrase}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.unlock.unlocking : t.unlock.unlockButton}
          </button>

          <div className="text-center">
            <button
              onClick={onRecover}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {t.unlock.recoverLink}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
