import { useIdentity } from '../hooks'
import { CreateIdentity, IdentityCard } from '../components'

export function Identity() {
  const { hasIdentity, isLoading } = useIdentity()

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        Lade...
      </div>
    )
  }

  if (!hasIdentity) {
    return <CreateIdentity />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Deine Identität</h1>
      <IdentityCard />
    </div>
  )
}
