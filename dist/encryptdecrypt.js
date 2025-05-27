import CryptoJS from 'crypto-js';
/**
 * Derives a shared AES key from sender and receiver public keys.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns 256-bit shared key as a hex string.
 */
const deriveSharedKey = (senderPublicKey, receiverPublicKey) => {
    const combinedKeys = senderPublicKey + receiverPublicKey;
    return CryptoJS.SHA256(combinedKeys).toString();
};
/**
 * Encrypts a message using AES with a shared key derived from public keys.
 * @param message The plaintext message to encrypt.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns Encrypted ciphertext string.
 */
export const encryptValue = (message, senderPublicKey, receiverPublicKey) => {
    const sharedKey = deriveSharedKey(senderPublicKey, receiverPublicKey);
    const ciphertext = CryptoJS.AES.encrypt(message, sharedKey).toString();
    return ciphertext;
};
/**
 * Decrypts a ciphertext message using AES with a shared key derived from public keys.
 * @param ciphertext The encrypted message string.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns Decrypted plaintext string.
 */
export const decryptValue = (ciphertext, senderPublicKey, receiverPublicKey) => {
    const sharedKey = deriveSharedKey(senderPublicKey, receiverPublicKey);
    const bytes = CryptoJS.AES.decrypt(ciphertext, sharedKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
};
const senderPubKey = 'SenderPublicKey123';
const receiverPubKey = 'ReceiverPublicKey456';
const message = JSON.stringify({ text: 'Hello friend!' });
const encrypted = encryptValue(message, senderPubKey, receiverPubKey);
console.log('Encrypted:', encrypted);
const decrypted = decryptValue(encrypted, senderPubKey, receiverPubKey);
console.log('Decrypted:', decrypted);
//# sourceMappingURL=encryptdecrypt.js.map