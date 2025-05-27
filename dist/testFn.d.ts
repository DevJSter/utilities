import 'react-native-get-random-values';
export interface KeyPair {
    publicKey: string;
    privateKey: string;
}
export interface PublicKeyResult {
    publicKey: string;
}
/**
 * Generate a random 6-word mnemonic from the BIP39 English wordlist
 */
export declare const generate6WordMnemonic: () => string;
/**
 * Derive Ed25519 keypair from a 6-word seedphrase and optional password
 * Verifies by signing a test message and returns hex-prefixed keys
 */
export declare const getPublicKeyPrivateKeyFromSeedphrase: (mnemonic: string, password?: string) => KeyPair;
/**
 * Recover public key from private key (64-byte secret key hex)
 */
export declare const getPublicKeyFromPrivateKey: (privateKeyHex: string) => PublicKeyResult | null;
/**
 * Test utility function to generate, verify and log keypair details
 */
export declare const testKeyUtils: () => void;
//# sourceMappingURL=testFn.d.ts.map