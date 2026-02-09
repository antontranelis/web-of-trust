import { useIdentity } from '../context'
import { useAdapters } from '../context'
import { useState, useEffect } from 'react'
import { Copy, Check, Fingerprint, Shield, Trash2, Database, Pencil, ChevronDown, ChevronRight } from 'lucide-react'
import { Avatar, AvatarUpload } from '../components/shared'
import { resetEvolu } from '../db'

export function Identity() {
  const { identity, did, clearIdentity } = useIdentity()
  const { storage } = useAdapters()
  const [copiedDid, setCopiedDid] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingDb, setIsResettingDb] = useState(false)
  const [dbResetDone, setDbResetDone] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    storage.getIdentity().then((id) => {
      if (id) {
        setProfileName(id.profile.name)
        setProfileBio(id.profile.bio || '')
        setProfileAvatar(id.profile.avatar)
      }
    })
  }, [storage])

  const handleSaveProfile = async () => {
    const existing = await storage.getIdentity()
    if (existing) {
      await storage.updateIdentity({
        ...existing,
        profile: {
          name: profileName.trim(),
          ...(profileBio.trim() ? { bio: profileBio.trim() } : {}),
          ...(profileAvatar ? { avatar: profileAvatar } : {}),
        },
      })
    }
    setIsEditingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  if (!identity || !did) {
    return null
  }

  const handleCopyDid = async () => {
    await navigator.clipboard.writeText(did)
    setCopiedDid(true)
    setTimeout(() => setCopiedDid(false), 2000)
  }

  const handleDeleteIdentity = async () => {
    if (!identity) return

    try {
      setIsDeleting(true)
      await identity.deleteStoredIdentity()
      await resetEvolu()
      localStorage.removeItem('wot-identity')
      clearIdentity()
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to delete identity:', error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const shortDid = did.length > 30
    ? `${did.slice(0, 16)}...${did.slice(-8)}`
    : did

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Deine Identität</h1>
        <p className="text-slate-600">
          Verwalte dein Profil und deine Sicherheitseinstellungen.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {isEditingProfile ? (
            <div className="space-y-4">
              <AvatarUpload
                name={profileName}
                avatar={profileAvatar}
                onAvatarChange={setProfileAvatar}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProfile()
                    if (e.key === 'Escape') setIsEditingProfile(false)
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Dein Name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Über mich</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                  placeholder="Ein kurzer Satz über dich (optional)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-4">
              <Avatar name={profileName} avatar={profileAvatar} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {profileName || <span className="text-slate-400 italic font-normal">Kein Name gesetzt</span>}
                  </h3>
                  {profileSaved ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                {profileBio && (
                  <p className="text-sm text-slate-600 mb-2">{profileBio}</p>
                )}
                <p className="text-xs text-slate-400 font-mono">{shortDid}</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              Dein privater Schlüssel ist verschlüsselt und verlässt niemals dieses Gerät.
              Mit deinen 12 Magischen Wörtern kannst du deine Identität auf anderen Geräten wiederherstellen.
            </div>
          </div>
        </div>

        {/* Details (collapsible) — DID + Maintenance + Danger Zone */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-lg"
          >
            <span>Details & Wartung</span>
            {showDetails ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {showDetails && (
            <div className="px-4 pb-4 space-y-5 border-t border-slate-100 pt-4">
              {/* DID */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Fingerprint size={16} className="text-slate-400" />
                  <h4 className="text-sm font-medium text-slate-500">DID</h4>
                </div>
                <div className="font-mono text-sm text-slate-900 break-all mb-2">{did}</div>
                <button
                  onClick={handleCopyDid}
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  {copiedDid ? <><Check size={14} /><span>Kopiert!</span></> : <><Copy size={14} /><span>Kopieren</span></>}
                </button>
              </div>

              <div className="border-t border-slate-200" />

              {/* Database Reset */}
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Kontakte, Verifikationen und Attestierungen zurücksetzen. Deine Identität bleibt erhalten.
                </p>
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
                  className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dbResetDone ? (
                    <><Check size={16} /><span>Zurückgesetzt! Lade neu...</span></>
                  ) : isResettingDb ? (
                    <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /><span>Setze zurück...</span></>
                  ) : (
                    <><Database size={16} /><span>Datenbank zurücksetzen</span></>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-200" />

              {/* Delete Identity */}
              <div className="space-y-2">
                <p className="text-sm text-red-700">
                  Identität endgültig löschen. Kann nicht rückgängig gemacht werden.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Identität löschen</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-900 font-medium">
                        Bist du sicher? Alle lokalen Daten werden gelöscht.
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        Stelle sicher, dass du deine 12 Magischen Wörter gesichert hast!
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteIdentity}
                        disabled={isDeleting}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /><span>Lösche...</span></>
                        ) : (
                          <><Trash2 size={16} /><span>Ja, endgültig löschen</span></>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
