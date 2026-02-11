export interface Profile {
  name: string
  bio?: string
  avatar?: string
}

export interface Identity {
  did: string
  profile: Profile
  createdAt: string
  updatedAt: string
}

export interface KeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
}

export interface PublicProfile {
  did: string
  name: string
  bio?: string
  avatar?: string
  updatedAt: string
}
