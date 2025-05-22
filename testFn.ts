import { encryptValue, decryptValue } from './encryptdecrypt';
import base64 from 'base-64';

const testEncryption = () => {
  const senderPublicKey = 'senderPublicKey123';
  const receiverPublicKey = 'receiverPublicKey456';
  const messageObj = { text: 'Hello, world!', timestamp: Date.now() };
  const messageString = JSON.stringify(messageObj);

  console.log('Original message:', messageObj);

  // Encrypt the message
  const encrypted = encryptValue(messageString, senderPublicKey, receiverPublicKey);
  console.log('Encrypted value:', encrypted);

  // Decrypt the message
  const decrypted = decryptValue(encrypted, senderPublicKey, receiverPublicKey);
  console.log('Decrypted value:', decrypted);

  // Test key mismatch
  try {
    decryptValue(encrypted, 'wrongSenderKey', receiverPublicKey);
  } catch (err: any) {
    console.log('Expected key mismatch error:', err.message);
  }

  // Test bad JSON inside valid base64 with correct combined keys
  try {
    const combinedKeys = `${senderPublicKey}${receiverPublicKey}`;
    const invalidJson = combinedKeys + 'not-a-json';
    const badEncrypted = base64.encode(invalidJson);

    decryptValue(badEncrypted, senderPublicKey, receiverPublicKey);
  } catch (err: any) {
    console.log('Expected parse error:', err.message);
  }
};

testEncryption();