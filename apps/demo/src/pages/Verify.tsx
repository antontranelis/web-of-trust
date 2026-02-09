import { VerificationFlow } from '../components'

export function Verify() {
  return (
    <div className="space-y-6">
      <VerificationFlow />
      <div className="bg-slate-100 rounded-xl p-4">
        <h3 className="font-medium text-slate-900 mb-2">Tipp</h3>
        <p className="text-sm text-slate-600">
          Scanne den QR-Code der anderen Person, um die Verifizierung zu starten.
          Alternativ kannst du den Code auch manuell kopieren — z.B. zum Testen in zwei Browser-Tabs.
        </p>
      </div>
    </div>
  )
}
