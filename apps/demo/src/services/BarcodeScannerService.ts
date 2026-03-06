import { Capacitor } from '@capacitor/core'
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
} from '@capacitor/barcode-scanner'

export async function isNativeScannerAvailable(): Promise<boolean> {
  return Capacitor.isNativePlatform()
}

export async function scanQrCodeNative(): Promise<string | null> {
  const result = await CapacitorBarcodeScanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
    cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    scanInstructions: 'QR-Code scannen',
    scanButton: false,
    android: {
      scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
    },
  })

  return result.ScanResult || null
}
