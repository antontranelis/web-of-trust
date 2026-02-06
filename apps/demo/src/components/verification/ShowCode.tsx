import { useState, useEffect, useRef } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import QRCode from 'qrcode'

interface ShowCodeProps {
  code: string
  title: string
  description: string
  onRefresh?: () => void
}

export function ShowCode({ code, title, description, onRefresh }: ShowCodeProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate QR code when code changes
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(code, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1e293b', // slate-900
            light: '#ffffff',
          },
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('Failed to generate QR code:', err)
      }
    }

    if (code) {
      generateQR()
    }
  }, [code])

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

      {/* QR Code Display */}
      {qrDataUrl && (
        <div className="flex justify-center">
          <div className="bg-white rounded-lg p-4 border-2 border-slate-200 shadow-sm">
            <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
          </div>
        </div>
      )}

      {/* Dev Mode: Text Code */}
      <details className="bg-slate-100 rounded-lg">
        <summary className="cursor-pointer p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Code ansehen (Dev-Mode)
            </span>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
        </summary>
        <div className="px-4 pb-4">
          <textarea
            readOnly
            value={code}
            className="w-full h-24 bg-white border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 resize-none focus:outline-none"
          />
        </div>
      </details>

      <p className="text-xs text-slate-500 text-center">
        Scanne den QR-Code mit der anderen Person oder nutze im Dev-Mode Copy & Paste.
      </p>
    </div>
  )
}
