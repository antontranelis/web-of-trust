import { useWotIdentity } from '../context'
import { useState, useEffect } from 'react'
import { Copy, Check, KeyRound, Fingerprint, Shield, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Identity() {
  const { identity, did } = useWotIdentity()
  const navigate = useNavigate()
  const [copiedDid, setCopiedDid] = useState(false)
  const [copiedPubKey, setCopiedPubKey] = useState(false)
  const [pubKey, setPubKey] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteIdentity = async () => {
    if (!identity) return

    try {
      setIsDeleting(true)
      await identity.deleteStoredIdentity()

      // Reload the page to trigger re-initialization
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to delete identity:', error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
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

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-red-900 mb-1">Gefahrenzone</h3>
            <p className="text-sm text-red-700">
              Das Löschen deiner Identität ist endgültig und kann nicht rückgängig gemacht werden.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              <span>Identität löschen</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-900 font-medium">
                  ⚠️ Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden!
                </p>
                <p className="text-sm text-red-800 mt-1">
                  Alle lokalen Daten (Identität, Kontakte, Verifikationen) werden gelöscht.
                  Stelle sicher, dass du deine 12-Wort Recovery Phrase gesichert hast!
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteIdentity}
                  disabled={isDeleting}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Lösche...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Ja, endgültig löschen</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
