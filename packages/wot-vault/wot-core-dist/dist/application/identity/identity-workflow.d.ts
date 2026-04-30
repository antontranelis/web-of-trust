import { ProtocolCryptoAdapter } from '../../protocol';
import { IdentitySeedVault } from '../../ports';
export interface IdentityEncryptedPayload {
    ciphertext: Uint8Array;
    nonce: Uint8Array;
    ephemeralPublicKey?: Uint8Array;
}
export interface PublicIdentityMaterial {
    did: string;
    kid: string;
    ed25519PublicKey: Uint8Array;
    x25519PublicKey: Uint8Array;
}
export interface IdentitySession {
    getDid(): string;
    sign(data: string): Promise<string>;
    signJws(payload: unknown): Promise<string>;
    deriveFrameworkKey(info: string): Promise<Uint8Array>;
    getPublicKeyMultibase(): Promise<string>;
    getEncryptionPublicKeyBytes(): Promise<Uint8Array>;
    encryptForRecipient(plaintext: Uint8Array, recipientPublicKeyBytes: Uint8Array): Promise<IdentityEncryptedPayload>;
    decryptForMe(payload: IdentityEncryptedPayload): Promise<Uint8Array>;
    deleteStoredIdentity(): Promise<void>;
}
export type PublicIdentitySession = IdentitySession & PublicIdentityMaterial;
export interface IdentityWorkflowOptions {
    crypto: ProtocolCryptoAdapter;
    vault?: IdentitySeedVault;
    generateMnemonic?: () => string;
}
export interface CreateIdentityInput {
    passphrase: string;
    storeSeed?: boolean;
}
export interface RecoverIdentityInput {
    mnemonic: string;
    passphrase: string;
    storeSeed?: boolean;
}
export interface UnlockStoredIdentityInput {
    passphrase?: string;
}
export interface CreateIdentityResult {
    mnemonic: string;
    identity: PublicIdentitySession;
}
export interface IdentityResult {
    identity: PublicIdentitySession;
}
export declare class IdentityWorkflow {
    private readonly crypto;
    private readonly vault;
    private readonly createMnemonic;
    private currentIdentity;
    constructor(options: IdentityWorkflowOptions);
    createIdentity(input: CreateIdentityInput): Promise<CreateIdentityResult>;
    recoverIdentity(input: RecoverIdentityInput): Promise<IdentityResult>;
    unlockStoredIdentity(input?: UnlockStoredIdentityInput): Promise<IdentityResult>;
    hasStoredIdentity(): Promise<boolean>;
    hasActiveSession(): Promise<boolean>;
    deleteStoredIdentity(): Promise<void>;
    lockIdentity(): void;
    getCurrentIdentity(): PublicIdentitySession | null;
    private recoverFromMnemonic;
    private identityFromSeed;
    private loadSeedWithSessionKey;
    private seedFromMnemonic;
    private requireVault;
}
//# sourceMappingURL=identity-workflow.d.ts.map