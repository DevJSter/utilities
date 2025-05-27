"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testKeyUtils = exports.getPublicKeyFromPrivateKey = exports.getPublicKeyPrivateKeyFromSeedphrase = exports.generate6WordMnemonic = void 0;
// Import polyfills first for React Native
require("react-native-get-random-values");
var tweetnacl_1 = require("tweetnacl");
var sha256_1 = require("@noble/hashes/sha256");
var utils_1 = require("@noble/hashes/utils");
var english_1 = require("@scure/bip39/wordlists/english");
/**
 * Generate a random 6-word mnemonic from the BIP39 English wordlist
 */
var generate6WordMnemonic = function () {
    var words = [];
    for (var i = 0; i < 6; i++) {
        var idx = Math.floor(Math.random() * english_1.wordlist.length);
        words.push(english_1.wordlist[idx]);
    }
    return words.join(' ');
};
exports.generate6WordMnemonic = generate6WordMnemonic;
/**
 * Derive Ed25519 keypair from a 6-word seedphrase and optional password
 * Verifies by signing a test message and returns hex-prefixed keys
 */
var getPublicKeyPrivateKeyFromSeedphrase = function (mnemonic, password) {
    if (password === void 0) { password = ''; }
    var mnemonicBytes = (0, utils_1.utf8ToBytes)(mnemonic + password);
    var seed = (0, sha256_1.sha256)(mnemonicBytes);
    var keyPair = tweetnacl_1.default.sign.keyPair.fromSeed(seed);
    var publicKeyHex = '0x' + Buffer.from(keyPair.publicKey).toString('hex');
    var privateKeyHex = '0x' + Buffer.from(keyPair.secretKey).toString('hex');
    // Verify keypair by signing and verifying a test message
    var testMessage = (0, utils_1.utf8ToBytes)('verification test');
    var signature = tweetnacl_1.default.sign.detached(testMessage, keyPair.secretKey);
    var isValid = tweetnacl_1.default.sign.detached.verify(testMessage, signature, keyPair.publicKey);
    if (!isValid) {
        throw new Error('Keypair verification failed. Derived keys do not match.');
    }
    return {
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
    };
};
exports.getPublicKeyPrivateKeyFromSeedphrase = getPublicKeyPrivateKeyFromSeedphrase;
/**
 * Recover public key from private key (64-byte secret key hex)
 */
var getPublicKeyFromPrivateKey = function (privateKeyHex) {
    try {
        var secretKey = Buffer.from(privateKeyHex.slice(2), 'hex');
        if (secretKey.length !== 64) {
            throw new Error('Invalid secretKey length (expected 64 bytes)');
        }
        var publicKey = secretKey.slice(32, 64);
        var publicKeyHex = '0x' + publicKey.toString('hex');
        return {
            publicKey: publicKeyHex,
        };
    }
    catch (error) {
        console.error('Invalid Private Key:', error);
        return null;
    }
};
exports.getPublicKeyFromPrivateKey = getPublicKeyFromPrivateKey;
/**
 * Test utility function to generate, verify and log keypair details
 */
var testKeyUtils = function () {
    var mnemonic = (0, exports.generate6WordMnemonic)();
    console.log('Generated 6-word mnemonic:', mnemonic);
    try {
        var _a = (0, exports.getPublicKeyPrivateKeyFromSeedphrase)(mnemonic), publicKey = _a.publicKey, privateKey = _a.privateKey;
        console.log('Public Key:', publicKey);
        console.log('Private Key:', privateKey);
        var recovered = (0, exports.getPublicKeyFromPrivateKey)(privateKey);
        console.log('Recovered Public Key:', recovered === null || recovered === void 0 ? void 0 : recovered.publicKey);
        var match = (recovered === null || recovered === void 0 ? void 0 : recovered.publicKey) === publicKey;
        console.log('Keypair matches after recovery:', match);
    }
    catch (e) {
        console.error('Error:', e.message);
    }
};
exports.testKeyUtils = testKeyUtils;
// 🔥 Uncomment to test locally
// testKeyUtils();
