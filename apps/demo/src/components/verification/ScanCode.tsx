import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Camera, X } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

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
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerElementId = 'qr-scanner'

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error('Failed to stop scanner:', err))
      }
    }
  }, [isScanning])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Wait for DOM to render the scanner element
      await new Promise((resolve) => setTimeout(resolve, 100))

      const scanner = new Html5Qrcode(scannerElementId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned QR code
          setCode(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Scanning in progress (not an error)
        }
      )
    } catch (err) {
      setError('Kamera konnte nicht gestartet werden. Bitte überprüfe die Berechtigungen.')
      setIsScanning(false)
      console.error('Scanner error:', err)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error('Failed to stop scanner:', err)
      }
    }
  }

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

      {/* QR Scanner */}
      {!isScanning && !code && (
        <button
          type="button"
          onClick={startScanning}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
        >
          <Camera size={20} className="text-slate-600" />
          <span className="text-slate-700 font-medium">QR-Code scannen</span>
        </button>
      )}

      {isScanning && (
        <div className="relative">
          <div id={scannerElementId} className="rounded-lg overflow-hidden" />
          <button
            type="button"
            onClick={stopScanning}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Dev Mode: Manual Input */}
      <details className="bg-slate-100 rounded-lg" open={!!code && !isScanning}>
        <summary className="cursor-pointer p-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Code manuell eingeben (Dev-Mode)
          </span>
        </summary>
        <div className="px-4 pb-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={placeholder}
            className="w-full h-24 bg-white border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </details>

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
