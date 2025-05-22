import CryptoJS from 'crypto-js';

/**
 * Derives a shared AES key from sender and receiver public keys.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns 256-bit shared key as a hex string.
 */

const deriveSharedKey = (senderPublicKey: string, receiverPublicKey: string): string => {
  const combinedKeys: string = senderPublicKey + receiverPublicKey;
  return CryptoJS.SHA256(combinedKeys).toString();
};

/**
 * Encrypts a message using AES with a shared key derived from public keys.
 * @param message The plaintext message to encrypt.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns Encrypted ciphertext string.
 */

export const encryptValue = (
  message: string,
  senderPublicKey: string,
  receiverPublicKey: string
): string => {
  const sharedKey: string = deriveSharedKey(senderPublicKey, receiverPublicKey);
  const ciphertext: string = CryptoJS.AES.encrypt(message, sharedKey).toString();
  return ciphertext;
};

/**
 * Decrypts a ciphertext message using AES with a shared key derived from public keys.
 * @param ciphertext The encrypted message string.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns Decrypted plaintext string.
 */
export const decryptValue = (
  ciphertext: string,
  senderPublicKey: string,
  receiverPublicKey: string
): string => {
  const sharedKey: string = deriveSharedKey(senderPublicKey, receiverPublicKey);
  const bytes = CryptoJS.AES.decrypt(ciphertext, sharedKey);
  const decrypted: string = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
};


const senderPubKey: string = 'SenderPublicKey123';
const receiverPubKey: string = 'ReceiverPublicKey456';

const message: string = JSON.stringify({ text: 'Hello friend!' });

const encrypted: string = encryptValue(message, senderPubKey, receiverPubKey);
console.log('Encrypted:', encrypted);

const decrypted: string = decryptValue(encrypted, senderPubKey, receiverPubKey);
console.log('Decrypted:', decrypted);
