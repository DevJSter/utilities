// Import polyfills first for React Native
import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes } from '@noble/hashes/utils';
import { wordlist } from '@scure/bip39/wordlists/english';
/**
 * Generate a random 6-word mnemonic from the BIP39 English wordlist
 */
export const generate6WordMnemonic = () => {
    const words = [];
    for (let i = 0; i < 6; i++) {
        const idx = Math.floor(Math.random() * wordlist.length);
        words.push(wordlist[idx]);
    }
    return words.join(' ');
};
/**
 * Derive Ed25519 keypair from a 6-word seedphrase and optional password
 * Verifies by signing a test message and returns hex-prefixed keys
 */
export const getPublicKeyPrivateKeyFromSeedphrase = (mnemonic, password = '') => {
    const mnemonicBytes = utf8ToBytes(mnemonic + password);
    const seed = sha256(mnemonicBytes);
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const publicKeyHex = '0x' + Buffer.from(keyPair.publicKey).toString('hex');
    const privateKeyHex = '0x' + Buffer.from(keyPair.secretKey).toString('hex');
    // Verify keypair by signing and verifying a test message
    const testMessage = utf8ToBytes('verification test');
    const signature = nacl.sign.detached(testMessage, keyPair.secretKey);
    const isValid = nacl.sign.detached.verify(testMessage, signature, keyPair.publicKey);
    if (!isValid) {
        throw new Error('Keypair verification failed. Derived keys do not match.');
    }
    return {
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
    };
};
/**
 * Recover public key from private key (64-byte secret key hex)
 */
export const getPublicKeyFromPrivateKey = (privateKeyHex) => {
    try {
        const secretKey = Buffer.from(privateKeyHex.slice(2), 'hex');
        if (secretKey.length !== 64) {
            throw new Error('Invalid secretKey length (expected 64 bytes)');
        }
        const publicKey = secretKey.slice(32, 64);
        const publicKeyHex = '0x' + publicKey.toString('hex');
        return {
            publicKey: publicKeyHex,
        };
    }
    catch (error) {
        console.error('Invalid Private Key:', error);
        return null;
    }
};
/**
 * Test utility function to generate, verify and log keypair details
 */
export const testKeyUtils = () => {
    const mnemonic = generate6WordMnemonic();
    console.log('Generated 6-word mnemonic:', mnemonic);
    try {
        const { publicKey, privateKey } = getPublicKeyPrivateKeyFromSeedphrase(mnemonic);
        console.log('Public Key:', publicKey);
        console.log('Private Key:', privateKey);
        const recovered = getPublicKeyFromPrivateKey(privateKey);
        console.log('Recovered Public Key:', recovered?.publicKey);
        const match = recovered?.publicKey === publicKey;
        console.log('Keypair matches after recovery:', match);
    }
    catch (e) {
        console.error('Error:', e.message);
    }
};
// 🔥 Uncomment to test locally
// testKeyUtils();
//# sourceMappingURL=testFn.js.map