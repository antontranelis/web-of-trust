import { useSecureIdentity } from '../context'
import { useState, useEffect } from 'react'
import { Copy, Check, KeyRound, Fingerprint, Shield } from 'lucide-react'

export function Identity() {
  const { identity, did } = useSecureIdentity()
  const [copiedDid, setCopiedDid] = useState(false)
  const [copiedPubKey, setCopiedPubKey] = useState(false)
  const [pubKey, setPubKey] = useState<string | null>(null)

  useEffect(() => {
    if (identity) {
      identity.getPublicKeyMultibase().then(setPubKey)
    }
  }, [identity])

  if (!identity || !did || !pubKey) {
    return null // Should never happen due to RequireIdentity guard
  }

  const handleCopyDid = async () => {
    await navigator.clipboard.writeText(did)
    setCopiedDid(true)
    setTimeout(() => setCopiedDid(false), 2000)
  }

  const handleCopyPubKey = async () => {
    await navigator.clipboard.writeText(pubKey)
    setCopiedPubKey(true)
    setTimeout(() => setCopiedPubKey(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Deine Identität</h1>
        <p className="text-slate-600">
          Deine dezentrale Identität ist durch kryptografische Schlüssel gesichert.
        </p>
      </div>

      <div className="space-y-4">
        {/* DID Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Fingerprint className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                Decentralized Identifier (DID)
              </h3>
              <div className="font-mono text-sm text-slate-900 break-all mb-2">
                {did}
              </div>
              <button
                onClick={handleCopyDid}
                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {copiedDid ? (
                  <>
                    <Check size={16} />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Kopieren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Public Key Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                Public Key (Multibase)
              </h3>
              <div className="font-mono text-sm text-slate-900 break-all mb-2">
                {pubKey}
              </div>
              <button
                onClick={handleCopyPubKey}
                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {copiedPubKey ? (
                  <>
                    <Check size={16} />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Kopieren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <strong>Sicher gespeichert:</strong> Dein privater Schlüssel ist mit deiner Passphrase
              verschlüsselt und verlässt niemals dieses Gerät. Mit deiner 12-Wort Recovery Phrase kannst
              du deine Identität auf anderen Geräten wiederherstellen.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
