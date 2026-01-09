import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface ScanCodeProps {
  title: string
  description: string
  placeholder: string
  buttonText: string
  onSubmit: (code: string) => void
  isLoading?: boolean
}

export function ScanCode({
  title,
  description,
  placeholder,
  buttonText,
  onSubmit,
  isLoading = false,
}: ScanCodeProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Bitte füge einen Code ein')
      return
    }
    setError(null)
    onSubmit(code.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-medium text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="bg-slate-100 rounded-lg p-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
          Code einfügen (Dev-Mode)
        </span>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          className="w-full h-24 bg-white border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !code.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
        <ArrowRight size={18} />
      </button>
    </form>
  )
}
