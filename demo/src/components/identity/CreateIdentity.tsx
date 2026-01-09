import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useIdentity } from '../../hooks'

export function CreateIdentity() {
  const { createIdentity, isLoading } = useIdentity()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein')
      return
    }

    try {
      setError(null)
      console.log('Creating identity with name:', name.trim())
      await createIdentity({ name: name.trim() })
      console.log('Identity created successfully')
    } catch (e) {
      console.error('Error creating identity:', e)
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Willkommen beim Web of Trust
        </h1>
        <p className="text-slate-600">
          Erstelle deine Identität, um loszulegen. Deine Daten bleiben auf deinem Gerät.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Dein Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Max Mustermann"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Erstelle Identität...' : 'Identität erstellen'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Es wird ein kryptografisches Schlüsselpaar generiert. Der private Schlüssel verlässt niemals dein Gerät.
      </p>
    </div>
  )
}
