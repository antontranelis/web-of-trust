import { useIdentity, usePendingVerification } from '../context'
import { useAdapters } from '../context'
import { useLanguage, plural } from '../i18n'
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check, Fingerprint, Shield, Trash2, Pencil, ChevronDown, ChevronRight, Users, Award, Globe, GlobeLock } from 'lucide-react'
import { Avatar, AvatarUpload } from '../components/shared'
import { resetEvolu } from '../db'
import { useProfile, useProfileSync, useAttestations, useContacts } from '../hooks'
import { useSubscribable } from '../hooks/useSubscribable'

export function Identity() {
  const { t, fmt, formatDate } = useLanguage()
  const { identity, did, clearIdentity } = useIdentity()
  const { storage, reactiveStorage } = useAdapters()
  const { uploadProfile, uploadVerificationsAndAttestations } = useProfileSync()
  const syncedProfile = useProfile()
  const { receivedAttestations, setAttestationAccepted } = useAttestations()
  const { contacts } = useContacts()
  const { incomingAttestation } = usePendingVerification()

  // Reactive verifications
  const verificationsSubscribable = useMemo(() => reactiveStorage.watchReceivedVerifications(), [reactiveStorage])
  const verifications = useSubscribable(verificationsSubscribable)

  // Attestation accepted state
  const [acceptedMap, setAcceptedMap] = useState<Record<string, boolean>>({})
  const [copiedDid, setCopiedDid] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Sync profile from Evolu (reactive — updates when synced from other device)
  // Skip when justSaved is true to avoid overwriting with stale Evolu snapshot
  useEffect(() => {
    if (!isEditingProfile && !justSaved) {
      setProfileName(syncedProfile.name)
      setProfileBio(syncedProfile.bio || '')
      setProfileAvatar(syncedProfile.avatar)
    }
  }, [syncedProfile, isEditingProfile, justSaved])

  // Load accepted state for received attestations
  // Re-runs when attestation dialog closes (incomingAttestation → null)
  useEffect(() => {
    async function loadAccepted() {
      const map: Record<string, boolean> = {}
      for (const att of receivedAttestations) {
        const meta = await storage.getAttestationMetadata(att.id)
        map[att.id] = meta?.accepted ?? false
      }
      setAcceptedMap(map)
    }
    loadAccepted()
  }, [receivedAttestations, storage, incomingAttestation])

  const handleToggleAttestation = async (attestationId: string, publish: boolean) => {
    await setAttestationAccepted(attestationId, publish)
    setAcceptedMap(prev => ({ ...prev, [attestationId]: publish }))
    uploadVerificationsAndAttestations()
  }

  const getContactName = (contactDid: string) => {
    if (contactDid === did) return t.identity.self
    return contacts.find(c => c.did === contactDid)?.name
  }

  const isKnownContact = (targetDid: string): boolean => {
    if (targetDid === did) return true
    return contacts.some(c => c.did === targetDid && c.status === 'active')
  }

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
    setJustSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
    // Allow Evolu reactive sync to take over again after a short delay
    setTimeout(() => setJustSaved(false), 500)

    // Upload to profile service (non-blocking)
    uploadProfile().catch(() => {})

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.identity.title}</h1>
        <p className="text-slate-600">
          {t.identity.subtitle}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.identity.nameLabel}</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProfile()
                    if (e.key === 'Escape') setIsEditingProfile(false)
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={t.identity.namePlaceholder}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.identity.aboutLabel}</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                  placeholder={t.identity.aboutPlaceholder}
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.common.save}
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-4">
              <Avatar name={profileName} avatar={profileAvatar} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {profileName || <span className="text-slate-400 italic font-normal">{t.identity.noNameSet}</span>}
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
              {t.identity.securityInfo}
            </div>
          </div>
        </div>

        {/* Verifications */}
        {verifications.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-blue-600" />
              <h3 className="text-sm font-medium text-slate-900">
                {fmt(t.identity.verifiedByCount, { count: verifications.length, personLabel: plural(verifications.length, t.common.personOne, t.common.personMany) })}
              </h3>
            </div>
            <div className="space-y-2">
              {verifications.map((v) => {
                const name = getContactName(v.from)
                const shortDid = v.from.length > 24
                  ? `${v.from.slice(0, 12)}...${v.from.slice(-6)}`
                  : v.from
                return (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <Link
                      to={`/p/${encodeURIComponent(v.from)}`}
                      className="text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      {name || <span className="font-mono text-xs">{shortDid}</span>}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {formatDate(new Date(v.timestamp))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Received Attestations */}
        {receivedAttestations.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-amber-600" />
              <h3 className="text-sm font-medium text-slate-900">
                {fmt(t.identity.attestationsAboutMe, { count: receivedAttestations.length, attestationLabel: plural(receivedAttestations.length, t.common.attestationOne, t.common.attestationMany) })}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3 ml-6">
              {t.identity.publishedAttestationsHint}
            </p>
            <div className="space-y-2">
              {receivedAttestations.map((a) => {
                const fromName = getContactName(a.from)
                const shortFrom = a.from.length > 24
                  ? `${a.from.slice(0, 12)}...${a.from.slice(-6)}`
                  : a.from
                const isPublic = acceptedMap[a.id] ?? false
                return (
                  <div key={a.id} className={`flex items-center gap-3 border-l-2 pl-3 ${isKnownContact(a.from) ? 'border-green-300' : 'border-amber-200'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">&ldquo;{a.claim}&rdquo;</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.common.from}{' '}
                        <Link
                          to={`/p/${encodeURIComponent(a.from)}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {fromName || shortFrom}
                        </Link>
                        {' '}&middot; {formatDate(new Date(a.createdAt))}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleAttestation(a.id, !isPublic)}
                      className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                        isPublic
                          ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isPublic ? t.identity.attestationPublicTitle : t.identity.attestationPrivateTitle}
                    >
                      {isPublic ? <Globe size={16} /> : <GlobeLock size={16} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Details (collapsible) — DID + Maintenance + Danger Zone */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-lg"
          >
            <span>{t.identity.detailsAndMaintenance}</span>
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
                  {copiedDid ? <><Check size={14} /><span>{t.common.copied}</span></> : <><Copy size={14} /><span>{t.common.copy}</span></>}
                </button>
              </div>

              <div className="border-t border-slate-200" />

              {/* Delete Identity */}
              <div className="space-y-2">
                <p className="text-sm text-red-700">
                  {t.identity.deleteWarning}
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>{t.identity.deleteButton}</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-900 font-medium">
                        {t.identity.deleteConfirmTitle}
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        {t.identity.deleteConfirmHint}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteIdentity}
                        disabled={isDeleting}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /><span>{t.identity.deleting}</span></>
                        ) : (
                          <><Trash2 size={16} /><span>{t.identity.deleteConfirmButton}</span></>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.common.cancel}
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
