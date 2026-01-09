import { Link } from 'react-router-dom'
import { Users, Shield, Award, ArrowRight } from 'lucide-react'
import { useIdentity, useContacts, useAttestations } from '../hooks'

export function Home() {
  const { identity } = useIdentity()
  const { verifiedContacts } = useContacts()
  const { myAttestations, receivedAttestations } = useAttestations()

  const stats = [
    {
      label: 'Kontakte',
      value: verifiedContacts.length,
      icon: Users,
      to: '/contacts',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Erstellt',
      value: myAttestations.length,
      icon: Award,
      to: '/attestations',
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Erhalten',
      value: receivedAttestations.length,
      icon: Award,
      to: '/attestations',
      color: 'bg-purple-100 text-purple-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Hallo, {identity?.profile.name}!
        </h1>
        <p className="text-slate-600">
          Willkommen im Web of Trust Demo.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Schnellaktionen</h2>

        <Link
          to="/verify"
          className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">Kontakt verifizieren</div>
              <div className="text-sm text-slate-600">Verifiziere jemanden persönlich</div>
            </div>
          </div>
          <ArrowRight className="text-primary-600" />
        </Link>

        {verifiedContacts.length > 0 && (
          <Link
            to="/attestations/new"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Attestation erstellen</div>
                <div className="text-sm text-slate-600">Bestätige etwas über einen Kontakt</div>
              </div>
            </div>
            <ArrowRight className="text-slate-400" />
          </Link>
        )}
      </div>

      <div className="bg-slate-100 rounded-xl p-4">
        <h3 className="font-medium text-slate-900 mb-2">Dev-Mode Hinweis</h3>
        <p className="text-sm text-slate-600">
          Dies ist ein Testbed für verschiedene CRDT-Frameworks. Die Verifizierung funktioniert
          via Copy/Paste zwischen Browser-Tabs. Öffne die App in zwei Tabs, um Multi-User
          Szenarien zu testen.
        </p>
      </div>
    </div>
  )
}
