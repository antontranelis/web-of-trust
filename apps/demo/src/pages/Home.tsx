import { Link } from 'react-router-dom'
import { Users, Shield, Award, ArrowRight, Wifi, WifiOff, CloudOff, Send } from 'lucide-react'
import { useContacts, useAttestations, useMessaging, useSyncStatus, useOutboxStatus, useLocalIdentity } from '../hooks'
import { useIdentity } from '../context'
import { useLanguage, plural } from '../i18n'

export function Home() {
  const { did } = useIdentity()
  const localIdentity = useLocalIdentity()
  const { activeContacts } = useContacts()
  const { myAttestations, receivedAttestations } = useAttestations()
  const { state: relayState, isConnected } = useMessaging()
  const { hasPendingSync } = useSyncStatus()
  const { pendingCount, hasPendingMessages } = useOutboxStatus()

  const { t, fmt } = useLanguage()
  const displayName = localIdentity?.profile.name || (did ? `did:...${did.slice(-8)}` : '')

  const stats = [
    {
      label: t.home.contactsLabel,
      value: activeContacts.length,
      icon: Users,
      to: '/contacts',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: t.home.createdLabel,
      value: myAttestations.length,
      icon: Award,
      to: '/attestations',
      color: 'bg-green-100 text-green-600',
    },
    {
      label: t.home.receivedLabel,
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
          {fmt(t.home.greeting, { name: displayName })}
        </h1>
        <p className="text-slate-600">
          {t.home.welcomeSubtitle}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi size={14} className="text-green-500" />
              <span className="text-green-600">{t.home.relayConnected}</span>
            </>
          ) : relayState === 'connecting' ? (
            <>
              <Wifi size={14} className="text-amber-500 animate-pulse" />
              <span className="text-amber-600">{t.home.relayConnecting}</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-slate-400" />
              <span className="text-slate-500">{t.home.relayOffline}</span>
            </>
          )}
          {hasPendingSync && (
            <>
              <span className="text-slate-300">|</span>
              <CloudOff size={14} className="text-amber-500" />
              <span className="text-amber-600">{t.home.profileSyncPending}</span>
            </>
          )}
          {hasPendingMessages && (
            <>
              <span className="text-slate-300">|</span>
              <Send size={14} className="text-amber-500" />
              <span className="text-amber-600">{fmt(plural(pendingCount, t.home.pendingMessagesOne, t.home.pendingMessagesMany), { count: pendingCount })}</span>
            </>
          )}
        </div>
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
        <h2 className="text-lg font-semibold text-slate-900">{t.home.quickActions}</h2>

        <Link
          to="/verify"
          className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">{t.home.verifyContact}</div>
              <div className="text-sm text-slate-600">{t.home.verifyContactDesc}</div>
            </div>
          </div>
          <ArrowRight className="text-primary-600" />
        </Link>

        {activeContacts.length > 0 && (
          <Link
            to="/attestations/new"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">{t.home.createAttestation}</div>
                <div className="text-sm text-slate-600">{t.home.createAttestationDesc}</div>
              </div>
            </div>
            <ArrowRight className="text-slate-400" />
          </Link>
        )}
      </div>
    </div>
  )
}
