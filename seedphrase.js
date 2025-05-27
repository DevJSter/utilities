import nacl from 'tweetnacl';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes } from '@noble/hashes/utils';
import { wordlist } from '@scure/bip39/wordlists/english';

// Generate 6-word mnemonic (for testing)
function generate6WordMnemonic() {
  const words = [];
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * wordlist.length);
    words.push(wordlist[idx]);
  }
  return words.join(' ');
}

/**
 * Given a seedphrase (mnemonic) and optional password,
 * derives Ed25519 keypair, checks validity by signing and verifying a test message,
 * and returns {publicKey, privateKey} with 0x hex prefixes.
 * Throws Error if verification fails.
 */
function getPublicKeyPrivateKeyFromSeedphrase(mnemonic, password = '') {
  // 1. Derive seed
  const mnemonicBytes = utf8ToBytes(mnemonic + password);
  const seed = sha256(mnemonicBytes);

  // 2. Generate keypair
  const keyPair = nacl.sign.keyPair.fromSeed(seed);

  // 3. Convert keys to hex string with 0x prefix
  const publicKeyHex = '0x' + Buffer.from(keyPair.publicKey).toString('hex');
  const privateKeyHex = '0x' + Buffer.from(keyPair.secretKey).toString('hex');

  // 4. Verification: sign & verify a test message
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
}

// Test wrapper function
function test() {
  const mnemonic = generate6WordMnemonic();

  console.log('Seedphrase:', mnemonic);
  try {
    const { publicKey, privateKey } = getPublicKeyPrivateKeyFromSeedphrase(mnemonic);
    console.log('Public Key:', publicKey);
    console.log('Private Key:', privateKey);
    console.log('Verification: SUCCESS');
  } catch (e) {
    console.error('Verification FAILED:', e.message);
  }
}

test();
