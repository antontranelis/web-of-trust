import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'

interface ShowCodeProps {
  code: string
  title: string
  description: string
  onRefresh?: () => void
}

export function ShowCode({ code, title, description, onRefresh }: ShowCodeProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="bg-slate-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Code (Dev-Mode)
          </span>
          <div className="flex gap-1">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded transition-colors"
                title="Neuen Code generieren"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={copyCode}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded transition-colors"
              title="Kopieren"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={code}
          className="w-full h-24 bg-white border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 resize-none focus:outline-none"
        />
      </div>

      <p className="text-xs text-slate-500 text-center">
        Im Dev-Mode kannst du den Code kopieren und im anderen Browser-Tab einfügen.
      </p>
    </div>
  )
}
