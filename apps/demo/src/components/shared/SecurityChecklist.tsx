import { CheckCircle2, Circle } from 'lucide-react'
import { useLanguage } from '../../i18n'

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

interface SecurityChecklistProps {
  items: ChecklistItem[]
  onToggle: (id: string) => void
}

export function SecurityChecklist({ items, onToggle }: SecurityChecklistProps) {
  const { t } = useLanguage()
  const allChecked = items.every((item) => item.checked)

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-colors ${
        allChecked ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <h3 className="text-sm font-medium text-slate-900 mb-3">
        {t.securityChecklist.title} {allChecked && '✓'}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start space-x-3 cursor-pointer group"
            onClick={() => onToggle(item.id)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.checked ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </div>
            <span
              className={`text-sm ${
                item.checked ? 'text-slate-700 line-through' : 'text-slate-900'
              }`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
