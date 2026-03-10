import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, UserMinus, Lock, ShieldCheck } from 'lucide-react'
import { useSpaces, useContacts } from '../hooks'
import { useAdapters, useIdentity } from '../context'
import { useLanguage } from '../i18n'
import { Tooltip } from '../components/ui/Tooltip'
import type { SpaceInfo, SpaceHandle } from '@real-life/wot-core'

interface SpaceDoc {
  notes: string
}

export function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const { t, fmt } = useLanguage()
  const navigate = useNavigate()
  const { getSpace, inviteMember, removeMember } = useSpaces()
  const { replication } = useAdapters()
  const { activeContacts } = useContacts()
  const { did } = useIdentity()
  const [space, setSpace] = useState<SpaceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [invitingDid, setInvitingDid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const handleRef = useRef<SpaceHandle<SpaceDoc> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!spaceId) return
    getSpace(spaceId).then(s => { setSpace(s); setLoading(false) })
  }, [spaceId, getSpace])

  // Open space handle and subscribe to remote updates
  useEffect(() => {
    if (!spaceId) return
    let cancelled = false
    let unsub: (() => void) | null = null

    async function open() {
      try {
        const handle = await replication.openSpace<SpaceDoc>(spaceId!)
        if (cancelled) {
          handle.close()
          return
        }
        handleRef.current = handle
        const doc = handle.getDoc()
        setNotes(doc?.notes ?? '')

        unsub = handle.onRemoteUpdate(() => {
          const updated = handle.getDoc()
          setNotes(updated?.notes ?? '')
        })
      } catch (err) {
        console.warn('Failed to open space:', err)
      }
    }

    open()
    return () => {
      cancelled = true
      unsub?.()
      if (handleRef.current) {
        handleRef.current.close()
        handleRef.current = null
      }
    }
  }, [spaceId, replication])

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNotes(value)
    if (handleRef.current) {
      handleRef.current.transact(doc => {
        doc.notes = value
      })
    }
  }, [])

  const refreshSpace = async () => {
    if (!spaceId) return
    const s = await getSpace(spaceId)
    setSpace(s)
  }

  if (loading) return <div className="text-slate-500">{t.common.loading}</div>
  if (!space) return <div className="text-slate-500">{t.spaces.notFound}</div>

  const isCreator = space.members[0] === did
  const invitableContacts = activeContacts.filter(c => !space.members.includes(c.did))

  const handleInvite = async (contactDid: string) => {
    setInvitingDid(contactDid)
    setError(null)
    try {
      await inviteMember(space.id, contactDid)
      await refreshSpace()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.spaces.errorInviteFailed)
    }
    setInvitingDid(null)
  }

  const handleRemove = async (memberDid: string) => {
    setError(null)
    try {
      await removeMember(space.id, memberDid)
      await refreshSpace()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.spaces.errorRemoveFailed)
    }
  }

  const getMemberName = (memberDid: string) => {
    if (memberDid === did) return t.identity.self
    const contact = activeContacts.find(c => c.did === memberDid)
    return contact?.name || memberDid.slice(-12)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/spaces')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{space.name || t.spaces.unnamed}</h1>
          <Tooltip content={t.spaces.encryptedBadge}>
            <ShieldCheck size={16} className="text-emerald-500" />
          </Tooltip>
        </div>
      </div>

      {/* Shared Notes */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">{t.spaces.notesHeading}</h2>
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={handleNotesChange}
          placeholder={t.spaces.notesPlaceholder}
          className="w-full min-h-[200px] p-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Members */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          {fmt(t.spaces.membersHeading, { count: String(space.members.length) })}
        </h2>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-2">
          {space.members.map(memberDid => (
            <div key={memberDid} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{getMemberName(memberDid)}</p>
                <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{memberDid}</p>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-emerald-500" />
                {isCreator && memberDid !== did && (
                  <button
                    onClick={() => handleRemove(memberDid)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.spaces.removeButton}
                  >
                    <UserMinus size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Invitable contacts — shown directly, one tap to invite */}
          {isCreator && invitableContacts.map(contact => (
            <div key={contact.did} className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-300 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-slate-500">{contact.name || contact.did.slice(-12)}</p>
              </div>
              <button
                onClick={() => handleInvite(contact.did)}
                disabled={invitingDid === contact.did}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserPlus size={16} />
                {t.spaces.inviteButton}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <p>{t.spaces.createdAt}: {new Date(space.createdAt).toLocaleDateString()}</p>
        <p>ID: {space.id.slice(0, 8)}...</p>
      </div>
    </div>
  )
}
