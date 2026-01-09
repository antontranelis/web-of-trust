export interface Verification {
  id: string
  initiatorDid: string
  responderDid: string
  initiatorSignature: string
  responderSignature: string
  timestamp: string
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

export interface VerificationChallenge {
  nonce: string
  timestamp: string
  initiatorDid: string
  initiatorPublicKey: string
  initiatorProfile: {
    name: string
  }
}

export interface VerificationResponse {
  nonce: string
  timestamp: string
  responderDid: string
  responderPublicKey: string
  responderProfile: {
    name: string
  }
  challengeSignature: string
}
