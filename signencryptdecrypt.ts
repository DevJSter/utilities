import CryptoJS from "crypto-js";
import * as secp from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { ethers } from "ethers";

// Set up the required HMAC-SHA256 function for secp256k1
secp.etc.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  return hmac(sha256, key, secp.etc.concatBytes(...msgs));
};

/**
 * Beautiful logging utility functions
 */
const logSection = (title: string, emoji: string = "🔹") => {
  console.log(`\n${emoji} ${title.toUpperCase()}`);
  console.log("═".repeat(70));
};

const logItem = (label: string, value: string, emoji: string = "  →") => {
  console.log(`${emoji} ${label}:`);
  if (value.length > 80) {
    // Split long strings for better readability
    const chunks = value.match(/.{1,80}/g) || [];
    chunks.forEach((chunk, i) => {
      console.log(`     ${chunk}`);
    });
  } else {
    console.log(`     ${value}`);
  }
  console.log("");
};

const logStatus = (operation: string, success: boolean) => {
  const emoji = success ? "✅" : "❌";
  const status = success ? "SUCCESS" : "FAILED";
  console.log(`${emoji} ${operation}: ${status}\n`);
};

const logComparison = (
  label: string,
  value1: string,
  value2: string,
  match: boolean
) => {
  console.log(`🔍 ${label}:`);
  console.log(`     Original: ${value1.substring(0, 40)}...`);
  console.log(`     Verified: ${value2.substring(0, 40)}...`);
  console.log(`     Match: ${match ? "✅ IDENTICAL" : "❌ DIFFERENT"}\n`);
};

/**
 * IMPROVED: Proper ECDH shared key derivation using secp256k1
 */
const deriveECDHSharedKey = (
  privateKeyBytes: Uint8Array,
  publicKeyBytes: Uint8Array
): string => {
  // Perform ECDH: multiply public key by private key to get shared point
  const sharedPoint = secp.getSharedSecret(privateKeyBytes, publicKeyBytes);
  // Use the x-coordinate of the shared point as the shared secret
  const sharedSecret = sha256(sharedPoint.slice(1, 33)); // Remove 0x04 prefix, take x-coordinate
  return Array.from(sharedSecret)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * IMPROVED: Sign a message with proper hashing
 */
export const signMessage = async (
  message: string,
  privateKeyBytes: Uint8Array
): Promise<string> => {
  const messageBytes = new TextEncoder().encode(message);
  const messageHash = sha256(messageBytes);
  const signature = await secp.sign(messageHash, privateKeyBytes);
  return signature.toCompactHex();
};

/**
 * IMPROVED: Verify a message signature with proper hashing
 */
export const verifySignature = async (
  message: string,
  signatureHex: string,
  publicKey: Uint8Array
): Promise<boolean> => {
  const messageBytes = new TextEncoder().encode(message);
  const messageHash = sha256(messageBytes);
  const signature = secp.Signature.fromCompact(signatureHex);
  return secp.verify(signature, messageHash, publicKey);
};

/**
 * SECURE MESSAGING: Sign-then-Encrypt
 * This creates a signed package and then encrypts the entire thing
 */
export const sendSecureMessage = async (
  message: string,
  senderPrivateKey: Uint8Array,
  senderPublicKey: Uint8Array,
  receiverPublicKey: Uint8Array
): Promise<string> => {
  // Step 1: Sign the message
  const signature = await signMessage(message, senderPrivateKey);

  // Step 2: Create signed package
  const signedPackage = JSON.stringify({
    message,
    signature,
    timestamp: new Date().toISOString(),
    from: Array.from(senderPublicKey)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  });

  // Step 3: Derive proper ECDH shared secret
  const sharedSecret = deriveECDHSharedKey(senderPrivateKey, receiverPublicKey);

  // Step 4: Encrypt the entire signed package
  const encryptedPackage = CryptoJS.AES.encrypt(
    signedPackage,
    sharedSecret
  ).toString();

  return encryptedPackage;
};

/**
 * SECURE MESSAGING: Decrypt-then-Verify
 * This decrypts the package and then verifies the signature
 */
export const receiveSecureMessage = async (
  encryptedPackage: string,
  receiverPrivateKey: Uint8Array,
  senderPublicKey: Uint8Array
): Promise<{
  message: string | null;
  verified: boolean;
  timestamp: string;
  from: string;
  error?: string;
}> => {
  try {
    // Step 1: Derive the same ECDH shared secret
    const sharedSecret = deriveECDHSharedKey(
      receiverPrivateKey,
      senderPublicKey
    );

    // Step 2: Decrypt the package
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPackage, sharedSecret);
    const signedPackage = decryptedBytes.toString(CryptoJS.enc.Utf8);

    if (!signedPackage) {
      throw new Error(
        "Decryption failed - invalid shared secret or corrupted data"
      );
    }

    const { message, signature, timestamp, from } = JSON.parse(signedPackage);

    // Step 3: Verify the signature BEFORE trusting the message
    const isValid = await verifySignature(message, signature, senderPublicKey);

    // Step 4: Return result - only provide message if signature is valid
    return {
      message: isValid ? message : null,
      verified: isValid,
      timestamp,
      from,
      error: isValid
        ? undefined
        : "Signature verification failed - message may be tampered or fake",
    };
  } catch (error) {
    return {
      message: null,
      verified: false,
      timestamp: "",
      from: "",
      error: `Decryption/Verification failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Generate a random secp256k1 keypair.
 */
export const generateKeyPair = () => {
  const privateKeyBytes = secp.utils.randomPrivateKey();
  const publicKeyBytes = secp.getPublicKey(privateKeyBytes, false); // uncompressed
  return {
    privateKeyBytes,
    publicKeyBytes,
  };
};

/**
 * Compare digital signatures in detail
 */
const compareDigitalSignatures = async (
  message: string,
  signature1: string,
  signature2: string,
  publicKey: Uint8Array
) => {
  logSection("🔍 DIGITAL SIGNATURE COMPARISON");

  // Show signature details
  logItem("Signature 1 (Original)", signature1, "🔐");
  logItem("Signature 2 (Comparison)", signature2, "🔒");

  // Compare signatures byte by byte
  const sig1Match = signature1 === signature2;
  logComparison("Signature Comparison", signature1, signature2, sig1Match);

  // Verify both signatures
  const sig1Valid = await verifySignature(message, signature1, publicKey);
  const sig2Valid = await verifySignature(message, signature2, publicKey);

  console.log("📊 Signature Verification Results:");
  console.log(`     Signature 1 Valid: ${sig1Valid ? "✅ YES" : "❌ NO"}`);
  console.log(`     Signature 2 Valid: ${sig2Valid ? "✅ YES" : "❌ NO"}`);
  console.log(
    `     Both Valid: ${sig1Valid && sig2Valid ? "✅ YES" : "❌ NO"}\n`
  );

  // Signature structure analysis
  console.log("🔬 Signature Structure Analysis:");
  console.log(`     Signature 1 Length: ${signature1.length} characters`);
  console.log(`     Signature 2 Length: ${signature2.length} characters`);
  console.log(`     Expected Length: 128 characters (64 bytes in hex)`);
  console.log(
    `     Format Valid: ${
      signature1.length === 128 && signature2.length === 128
        ? "✅ YES"
        : "❌ NO"
    }\n`
  );

  return { sig1Valid, sig2Valid, signaturesMatch: sig1Match };
};

/**
 * Create Ethereum wallet using ethers
 */
const createEthereumWallet = () => {
  logSection("💰 ETHEREUM WALLET CREATION");

  // Create random wallet
  const wallet = ethers.Wallet.createRandom();

  logItem("Wallet Address", wallet.address, "🏦");
  logItem(
    "Private Key",
    wallet.privateKey.substring(0, 16) + "...[REDACTED FOR SECURITY]",
    "🔐"
  );
  logItem("Public Key", wallet.publicKey, "🔑");

  // Show mnemonic phrase
  if (wallet.mnemonic) {
    logItem("Mnemonic Phrase", wallet.mnemonic.phrase, "📝");
  }

  // Additional wallet info
  console.log("📊 Wallet Information:");
  console.log(`     Network: Ethereum Mainnet/Testnet Compatible`);
  console.log(`     Key Format: secp256k1`);
  console.log(`     Address Format: EIP-55 Checksum`);
  console.log(
    `     Private Key Length: ${wallet.privateKey.length} characters\n`
  );

  return wallet;
};

// SECURE MESSAGING DEMO - Sign-then-Encrypt Implementation
// (async () => {
//   try {
//     logSection("🛡️ SECURE MESSAGING DEMO: SIGN-THEN-ENCRYPT", "🎯");

//     // Generate Alice and Bob's key pairs
//     console.log("👥 Generating Alice and Bob key pairs...\n");
//     const aliceKeys = generateKeyPair();
//     const bobKeys = generateKeyPair();

//     const alicePubKeyHex = Array.from(aliceKeys.publicKeyBytes)
//       .map((b) => b.toString(16).padStart(2, "0"))
//       .join("");
//     const bobPubKeyHex = Array.from(bobKeys.publicKeyBytes)
//       .map((b) => b.toString(16).padStart(2, "0"))
//       .join("");

//     logSection("🔑 PARTICIPANT KEY INFORMATION");
//     logItem("Alice Public Key", alicePubKeyHex, "👩");
//     logItem("Bob Public Key", bobPubKeyHex, "👨");

//     // Messages to send
//     const secretMessage =
//       "Meet me at the secret location at midnight. The code is: ALPHA-7749";
//     const normalMessage = "Hey Bob! How are you doing today?";

//     logSection("📨 ALICE SENDS SECURE MESSAGES TO BOB");

//     // Alice sends first message
//     console.log("📤 Alice is sending secure message 1...");
//     const encryptedMessage1 = await sendSecureMessage(
//       secretMessage,
//       aliceKeys.privateKeyBytes,
//       aliceKeys.publicKeyBytes,
//       bobKeys.publicKeyBytes
//     );
//     logItem("Encrypted Package 1", encryptedMessage1, "🔒");

//     // Alice sends second message
//     console.log("📤 Alice is sending secure message 2...");
//     const encryptedMessage2 = await sendSecureMessage(
//       normalMessage,
//       aliceKeys.privateKeyBytes,
//       aliceKeys.publicKeyBytes,
//       bobKeys.publicKeyBytes
//     );
//     logItem("Encrypted Package 2", encryptedMessage2, "🔒");

//     logSection("📨 BOB RECEIVES AND PROCESSES MESSAGES");

//     // Bob receives first message
//     console.log("📥 Bob is receiving message 1...");
//     const receivedMessage1 = await receiveSecureMessage(
//       encryptedMessage1,
//       bobKeys.privateKeyBytes,
//       aliceKeys.publicKeyBytes
//     );

//     if (receivedMessage1.verified) {
//       logItem("✅ Verified Message 1", receivedMessage1.message!, "🔓");
//       logItem("Timestamp", receivedMessage1.timestamp, "⏰");
//       logItem("From (Public Key)", receivedMessage1.from, "👩");
//     } else {
//       console.log("❌ Message 1 verification failed:", receivedMessage1.error);
//     }

//     // Bob receives second message
//     console.log("📥 Bob is receiving message 2...");
//     const receivedMessage2 = await receiveSecureMessage(
//       encryptedMessage2,
//       bobKeys.privateKeyBytes,
//       aliceKeys.publicKeyBytes
//     );

//     if (receivedMessage2.verified) {
//       logItem("✅ Verified Message 2", receivedMessage2.message!, "🔓");
//       logItem("Timestamp", receivedMessage2.timestamp, "⏰");
//       logItem("From (Public Key)", receivedMessage2.from, "👩");
//     } else {
//       console.log("❌ Message 2 verification failed:", receivedMessage2.error);
//     }

//     // Test tampering detection
//     logSection("🕵️ TAMPERING DETECTION TEST");
//     console.log("🔧 Simulating message tampering...");

//     // Corrupt the encrypted message
//     const tamperedMessage = encryptedMessage1.substring(0, -10) + "TAMPERED!";
//     console.log("🚨 Attempting to receive tampered message...");

//     const tamperedResult = await receiveSecureMessage(
//       tamperedMessage,
//       bobKeys.privateKeyBytes,
//       aliceKeys.publicKeyBytes
//     );

//     if (!tamperedResult.verified) {
//       console.log("✅ Tampering detected successfully!");
//       console.log(`   Error: ${tamperedResult.error}`);
//     } else {
//       console.log("❌ Tampering detection failed!");
//     }

//     // Demonstrate signature comparison
//     logSection("🔬 SIGNATURE ANALYSIS");
//     const testMessage = "Test message for signature analysis";
//     const sig1 = await signMessage(testMessage, aliceKeys.privateKeyBytes);
//     const sig2 = await signMessage(testMessage, aliceKeys.privateKeyBytes);

//     await compareDigitalSignatures(
//       testMessage,
//       sig1,
//       sig2,
//       aliceKeys.publicKeyBytes
//     );

//     // Create Ethereum wallet
//     const ethWallet = createEthereumWallet();

//     // Final verification
//     const allVerified =
//       receivedMessage1.verified &&
//       receivedMessage2.verified &&
//       !tamperedResult.verified;

//     logSection("🔍 FINAL SECURITY VERIFICATION");
//     logStatus("Message 1 Authentication", receivedMessage1.verified);
//     logStatus("Message 2 Authentication", receivedMessage2.verified);
//     logStatus("Tampering Detection", !tamperedResult.verified);
//     logStatus("Overall Security Protocol", allVerified);

//     if (allVerified) {
//       console.log("🎉 SECURE MESSAGING PROTOCOL WORKING PERFECTLY!");
//       console.log("═".repeat(70));

//       // Operation summary
//       logSection("📊 SECURITY PROTOCOL SUMMARY");
//       console.log("• 🔐 Sign-then-Encrypt: ✅ IMPLEMENTED");
//       console.log("• 🤝 ECDH Key Exchange: ✅ PROPER DERIVATION");
//       console.log("• ✍️  Digital Signatures: ✅ VERIFIED");
//       console.log("• 🛡️  Message Authentication: ✅ CONFIRMED");
//       console.log("• 🔒 End-to-End Encryption: ✅ WORKING");
//       console.log("• 🚨 Tampering Detection: ✅ FUNCTIONAL");
//       console.log("• 💰 Ethereum Integration: ✅ READY");
//       console.log("• 🔍 Non-repudiation: ✅ ENSURED");
//       console.log("\n🏁 SECURE MESSAGING SYSTEM FULLY OPERATIONAL!");

//       console.log("\n💡 KEY SECURITY PROPERTIES ACHIEVED:");
//       console.log(
//         "   • Confidentiality: Only Bob can decrypt Alice's messages"
//       );
//       console.log(
//         "   • Authenticity: Bob knows messages really came from Alice"
//       );
//       console.log("   • Integrity: Any tampering is detected immediately");
//       console.log(
//         "   • Non-repudiation: Alice cannot deny sending the messages"
//       );
//     } else {
//       console.log("⚠️  WARNING: SECURITY PROTOCOL ISSUES DETECTED!");
//     }
//   } catch (error) {
//     console.error("💥 SECURE MESSAGING ERROR:");
//     console.error("═".repeat(50));
//     if (error instanceof Error) {
//       console.error(`❌ ${error.message}`);
//       console.error("Stack trace:", error.stack);
//     } else {
//       console.error("❌ An unknown error occurred:", error);
//     }
//   }
// })();
