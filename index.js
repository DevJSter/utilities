// import { Wallet, SigningKey } from 'ethers';

// // Generate a new key pair
// function generateKeyPair() {
//   const wallet = Wallet.createRandom();
//   const signingKey = new SigningKey(wallet.privateKey);

//   return {
//     privateKey: wallet.privateKey,
//     publicKey: signingKey.publicKey,
//     address: wallet.address,
//   };
// }

// // Get public key from private key
// function getPublicKeyFromPrivateKey(privateKey) {
//   try {
//     const signingKey = new SigningKey(privateKey);
//     return {
//       publicKey: signingKey.publicKey,
//       address: new Wallet(privateKey).address,
//     };
//   } catch (error) {
//     console.error("Invalid Private Key:", error);
//     return null;
//   }
// }

// // Test it
// const newKeys = generateKeyPair();
// console.log("🆕 New Key Pair:");
// console.log("Private Key:", newKeys.privateKey);
// console.log("Public Key :", newKeys.publicKey);
// console.log("Address    :", newKeys.address);

// const recovered = getPublicKeyFromPrivateKey(newKeys.privateKey);
//  console.log(recovered);
// console.log("\n🔐 Recovered from Private Key:");
// console.log("Public Key :", recovered.publicKey);
// console.log("Address    :", recovered.address);


const crypto = require('crypto');
const { encrypt, decrypt } = require('./main'); // replace with your actual file path

// Generate two key pairs (A and B)
const { privateKey: privA, publicKey: pubA } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp256k1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const { privateKey: privB, publicKey: pubB } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp256k1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

// A encrypts a message to B
const encryptedPayload = encrypt(privA, pubB, 'hello world');

console.log('Encrypted:', encryptedPayload);

// B decrypts the message from A
const decryptedMessage = decrypt(privB, pubA, encryptedPayload);

console.log('Decrypted:', decryptedMessage);
