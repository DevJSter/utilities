/**
 * Encrypts a message using AES with a shared key derived from public keys.
 * @param message The plaintext message to encrypt.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns Encrypted ciphertext string.
 */
export declare const encryptValue: (message: string, senderPublicKey: string, receiverPublicKey: string) => string;
/**
 * Decrypts a ciphertext message using AES with a shared key derived from public keys.
 * @param ciphertext The encrypted message string.
 * @param senderPublicKey Sender's public key.
 * @param receiverPublicKey Receiver's public key.
 * @returns Decrypted plaintext string.
 */
export declare const decryptValue: (ciphertext: string, senderPublicKey: string, receiverPublicKey: string) => string;
//# sourceMappingURL=encryptdecrypt.d.ts.map