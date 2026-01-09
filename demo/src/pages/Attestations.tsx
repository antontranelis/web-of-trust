import { Link, Routes, Route } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AttestationList, CreateAttestation } from '../components'
import { useContacts } from '../hooks'

function AttestationsIndex() {
  const { verifiedContacts } = useContacts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Attestationen</h1>
        {verifiedContacts.length > 0 && (
          <Link
            to="/attestations/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Erstellen
          </Link>
        )}
      </div>
      <AttestationList />
    </div>
  )
}

export function Attestations() {
  return (
    <Routes>
      <Route index element={<AttestationsIndex />} />
      <Route path="new" element={<CreateAttestation />} />
    </Routes>
  )
}
