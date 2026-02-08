import { useIdentity } from '../context'
import { useAdapters } from '../context'
import { useState, useEffect } from 'react'
import { Copy, Check, KeyRound, Fingerprint, Shield, Trash2, Database, Pencil, User } from 'lucide-react'
import { resetEvolu } from '../db'

export function Identity() {
  const { identity, did, clearIdentity } = useIdentity()
  const { storage } = useAdapters()
  const [copiedDid, setCopiedDid] = useState(false)
  const [copiedPubKey, setCopiedPubKey] = useState(false)
  const [pubKey, setPubKey] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingDb, setIsResettingDb] = useState(false)
  const [dbResetDone, setDbResetDone] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    if (identity) {
      identity.getPublicKeyMultibase().then(setPubKey)
    }
    storage.getIdentity().then((id) => {
      if (id) setProfileName(id.profile.name)
    })
  }, [identity, storage])

  const handleSaveName = async () => {
    const existing = await storage.getIdentity()
    if (existing) {
      await storage.updateIdentity({ ...existing, profile: { ...existing.profile, name: profileName.trim() } })
    }
    setIsEditingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

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

      // Delete identity seed (wot-identity DB)
      await identity.deleteStoredIdentity()

      // Reset Evolu (cleans OPFS + IndexedDB + clears singleton)
      await resetEvolu()

      // Clear localStorage identity cache
      localStorage.removeItem('wot-identity')

      // Clear React context state
      clearIdentity()

      // Navigate to root to trigger onboarding
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
        {/* Name Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-700 mb-1">Name</h3>
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') setIsEditingName(false)
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Dein Name"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-900">
                    {profileName || <span className="text-slate-400 italic">Kein Name gesetzt</span>}
                  </span>
                  {nameSaved ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

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
              <strong>Sicher gespeichert:</strong> Dein privater Schlüssel ist mit deinem Passwort
              verschlüsselt und verlässt niemals dieses Gerät. Mit deinen 12 Magischen Wörtern kannst
              du deine Identität auf anderen Geräten wiederherstellen.
            </div>
          </div>
        </div>

        {/* Database Reset */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-amber-900 mb-1">Datenbank zurücksetzen</h3>
            <p className="text-sm text-amber-700">
              Löscht alle Kontakte, Verifikationen und Attestierungen. Deine Identität bleibt erhalten.
              Nützlich wenn alte Sync-Daten Probleme verursachen.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                setIsResettingDb(true)
                await resetEvolu()
                setDbResetDone(true)
                setTimeout(() => { window.location.reload() }, 1500)
              } catch (error) {
                console.error('Failed to reset database:', error)
                setIsResettingDb(false)
              }
            }}
            disabled={isResettingDb}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dbResetDone ? (
              <>
                <Check size={16} />
                <span>Zurückgesetzt! Lade neu...</span>
              </>
            ) : isResettingDb ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Setze zurück...</span>
              </>
            ) : (
              <>
                <Database size={16} />
                <span>Datenbank zurücksetzen</span>
              </>
            )}
          </button>
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
                  Stelle sicher, dass du deine 12 Magischen Wörter gesichert hast!
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
