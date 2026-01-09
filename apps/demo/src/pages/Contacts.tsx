import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { ContactList } from '../components'

export function Contacts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Kontakte</h1>
        <Link
          to="/verify"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Shield size={16} />
          Verifizieren
        </Link>
      </div>
      <ContactList />
    </div>
  )
}
