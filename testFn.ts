import { Wallet } from 'ethers';
import { keccak256, toUtf8Bytes } from 'ethers';
import CryptoJS from 'crypto-js';
import { wordlist } from './constants';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface PublicKeyResult {
  publicKey: string;
}

function getPseudoRandomInt(max: number) {
  const entropy = `${Date.now()}-${Math.random()}`;
  const hash = CryptoJS.SHA256(entropy).toString();
  const int = parseInt(hash.substring(0, 8), 16);
  return int % max;
}

export const generate6WordMnemonic = (): string => {
  const words: string[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = getPseudoRandomInt(wordlist.length);
    words.push(wordlist[idx]);
  }
  return words.join(' ');
};

export const getPublicKeyPrivateKeyFromSeedphrase = (mnemonic: string): KeyPair => {
  // Hash the 6-word mnemonic into a private key
  const hash = keccak256(toUtf8Bytes(mnemonic));
  const wallet = new Wallet(hash);
  console.log(wallet.address, wallet.privateKey);
  return {
    publicKey: wallet.address,
    privateKey: wallet.privateKey,
  };
};

export const getPublicKeyFromPrivateKey = (privateKeyHex: string): PublicKeyResult | null => {
  try {
    const wallet = new Wallet(privateKeyHex);
    return { publicKey: wallet.address };
  } catch (error) {
    console.error('Invalid Private Key:', error);
    return null;
  }
};

export const getKeypairFromPrivateKey = (privateKeyHex: string): KeyPair | null => {
  try {
    const wallet = new Wallet(privateKeyHex);
    return {
      publicKey: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error('Invalid Private Key:', error);
    return null;
  }
};


export const testNewFunctions = (): void => {
  const mnemonic = generate6WordMnemonic();
  console.log('Generated mnemonic:', mnemonic);

  try {
    const keypair = getPublicKeyPrivateKeyFromSeedphrase(mnemonic);
    // console.log('Derived from seedphrase - Public Key:', keypair.publicKey);
    // console.log('Derived from seedphrase - Private Key:', keypair.privateKey);

    // const recoveredKeypair = getKeypairFromPrivateKey(keypair.privateKey);
    // console.log('Recovered from private key - Public Key:', recoveredKeypair?.publicKey);
    // console.log('Recovered from private key - Private Key:', recoveredKeypair?.privateKey);

    // console.log(
    //   'Keys match:',
    //   recoveredKeypair?.publicKey === keypair.publicKey &&
    //     recoveredKeypair?.privateKey === keypair.privateKey
    // );

  } catch (e: any) {
    console.error('Error in testNewFunctions:', e.message);
  }
};

// 🔥 Uncomment to test
testNewFunctions();
