import { useState } from 'react'
import { User, Copy, Check, Trash2 } from 'lucide-react'
import { useIdentity } from '../../hooks'

export function IdentityCard() {
  const { identity, deleteIdentity, isLoading } = useIdentity()
  const [copied, setCopied] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  if (!identity) return null

  const copyDid = async () => {
    await navigator.clipboard.writeText(identity.did)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (window.confirm('Bist du sicher? Alle Daten werden gelöscht.')) {
      await deleteIdentity()
    }
    setShowDelete(false)
  }

  const shortDid = identity.did.slice(0, 20) + '...' + identity.did.slice(-8)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{identity.profile.name}</h2>
            <p className="text-primary-100 text-sm">Verifizierte Identität</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            DID (Dezentraler Identifier)
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-slate-100 px-3 py-2 rounded font-mono text-slate-700 overflow-hidden">
              {shortDid}
            </code>
            <button
              onClick={copyDid}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="DID kopieren"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-slate-500">Erstellt</span>
            <span className="font-medium">
              {new Date(identity.createdAt).toLocaleDateString('de-DE')}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Aktualisiert</span>
            <span className="font-medium">
              {new Date(identity.updatedAt).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          {showDelete ? (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Ja, löschen
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Identität löschen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
