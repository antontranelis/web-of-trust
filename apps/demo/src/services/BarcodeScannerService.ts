import { Capacitor } from '@capacitor/core'
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
} from '@capacitor/barcode-scanner'

export function isNativeScannerAvailable(): boolean {
  return Capacitor.isNativePlatform()
}

export async function scanQrCodeNative(scanInstructions: string): Promise<string | null> {
  try {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
      scanInstructions,
      scanButton: false,
      android: {
        scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
      },
    })

    return result.ScanResult || null
  } catch (err) {
    // User cancelled or scanner closed — not an error
    // But log unexpected errors so they're not silently swallowed
    if (err instanceof Error && !err.message.includes('cancel')) {
      console.warn('[BarcodeScannerService]', err.message)
    }
    return null
  }
}
