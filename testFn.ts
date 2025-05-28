const nacl = require('tweetnacl');
const { sha256 } = require('@noble/hashes/sha256');
const { utf8ToBytes } = require('@noble/hashes/utils');
const { wordlist } = require('@scure/bip39/wordlists/english');


// ✅ Type definitions
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
export const generate6WordMnemonic = (): string => {
  const words: string[] = [];
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
export const getPublicKeyPrivateKeyFromSeedphrase = (mnemonic: string, password = ''): KeyPair => {
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
export const getPublicKeyFromPrivateKey = (privateKeyHex: string): PublicKeyResult | null => {
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
  } catch (error) {
    console.error('Invalid Private Key:', error);
    return null;
  }
};

/**
 * Test utility function to generate, verify and log keypair details
 */
export const testKeyUtils = (): void => {
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
  } catch (e: any) {
    console.error('Error:', e.message);
  }
};

/**
 * Given a private key hex (64 bytes), return the KeyPair (public + private)
 * This doesn't recover the seedphrase (not possible), only keys
 */
export const getKeypairFromPrivateKey = (privateKeyHex: string): KeyPair | null => {
  try {
    const secretKey = Buffer.from(privateKeyHex.slice(2), 'hex');
    if (secretKey.length !== 64) {
      throw new Error('Invalid secretKey length (expected 64 bytes)');
    }

    const publicKey = secretKey.slice(32, 64);
    const publicKeyHex = '0x' + publicKey.toString('hex');
    const privateKeyHexNormalized = '0x' + secretKey.toString('hex');

    return {
      publicKey: publicKeyHex,
      privateKey: privateKeyHexNormalized,
    };
  } catch (error) {
    console.error('Invalid Private Key:', error);
    return null;
  }
};

/**
 * Given a seedphrase (6-word mnemonic), returns it (could add validation if desired)
 */
export const getSeedphraseFromSeedphrase = (seedphrase: string): string => {
  // Optionally add validation here if desired
  return seedphrase.trim();
};

/**
 * Test function for new methods
 */
export const testNewFunctions = (): void => {
  const mnemonic = generate6WordMnemonic();
  console.log('Generated mnemonic:', mnemonic);

  try {
    // From seedphrase get keypair
    const keypair = getPublicKeyPrivateKeyFromSeedphrase(mnemonic);
    console.log('Derived from seedphrase - Public Key:', keypair.publicKey);
    console.log('Derived from seedphrase - Private Key:', keypair.privateKey);

    // From private key recover keypair
    const recoveredKeypair = getKeypairFromPrivateKey(keypair.privateKey);
    console.log('Recovered from private key - Public Key:', recoveredKeypair?.publicKey);
    console.log('Recovered from private key - Private Key:', recoveredKeypair?.privateKey);

    // Confirm keys match
    console.log('Keys match:', recoveredKeypair?.publicKey === keypair.publicKey && recoveredKeypair?.privateKey === keypair.privateKey);

    // Return seedphrase unchanged
    const recoveredSeedphrase = getSeedphraseFromSeedphrase(mnemonic);
    console.log('Recovered Seedphrase:', recoveredSeedphrase);
  } catch (e: any) {
    console.error('Error in testNewFunctions:', e.message);
  }
};

// 🔥 Uncomment to test
testNewFunctions();


// 🔥 Uncomment to test locally
// testKeyUtils();
