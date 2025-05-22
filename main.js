const crypto = require('crypto');

function encrypt(privKeyPem, pubKeyPem, message) {
  const privKey = crypto.createPrivateKey(privKeyPem);
  const pubKey = crypto.createPublicKey(pubKeyPem);
  const secret = crypto.diffieHellman({ privateKey: privKey, publicKey: pubKey });
  const key = crypto.createHash('sha256').update(secret).digest();

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(message, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');

  return { iv: iv.toString('base64'), tag, encrypted };
}

function decrypt(privKeyPem, pubKeyPem, { iv, tag, encrypted }) {
  const privKey = crypto.createPrivateKey(privKeyPem);
  const pubKey = crypto.createPublicKey(pubKeyPem);
  const secret = crypto.diffieHellman({ privateKey: privKey, publicKey: pubKey });
  const key = crypto.createHash('sha256').update(secret).digest();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };