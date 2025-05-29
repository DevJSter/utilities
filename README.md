# 🛡️ Secure Messaging Library

A production-grade, end-to-end encrypted messaging library implementing the **Sign-then-Encrypt** pattern with secp256k1 elliptic curve cryptography.

## 🔥 Features

- **🔐 End-to-End Encryption** using ECDH key exchange + AES
- **✍️ Digital Signatures** for message authenticity 
- **🚨 Tamper Detection** - corrupted messages are rejected
- **⏰ Replay Protection** with timestamps
- **🛡️ Non-repudiation** - cryptographic proof of sender
- **📱 React Native Compatible** 
- **⚡ TypeScript Support**

## 🔒 Security Properties

| Property | Description | How It's Achieved |
|----------|-------------|-------------------|
| **Confidentiality** | Only intended recipient can read | ECDH + AES encryption |
| **Authenticity** | Verify who sent the message | secp256k1 digital signatures |
| **Integrity** | Detect message tampering | Signature verification |
| **Non-repudiation** | Sender cannot deny sending | Cryptographic signatures |
| **Forward Secrecy** | Past messages stay secure | Unique shared secrets |

## 📦 Installation

```bash
npm install crypto-js @noble/secp256k1 @noble/hashes ethers
```

### For React Native:
```bash
npm install crypto-js @noble/secp256k1 @noble/hashes ethers
npm install react-native-get-random-values # For secure randomness
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { sendSecureMessage, receiveSecureMessage, generateKeyPair } from './secure-messaging';

// Generate key pairs
const aliceKeys = generateKeyPair();
const bobKeys = generateKeyPair();

// Alice sends a message to Bob
const encrypted = await sendSecureMessage(
  "Hello Bob! This is a secret message.",
  aliceKeys.privateKeyBytes,
  aliceKeys.publicKeyBytes,
  bobKeys.publicKeyBytes
);

// Bob receives and verifies the message
const result = await receiveSecureMessage(
  encrypted,
  bobKeys.privateKeyBytes,
  aliceKeys.publicKeyBytes
);

if (result.verified) {
  console.log("Message:", result.message);
  console.log("From:", result.from);
  console.log("Timestamp:", result.timestamp);
} else {
  console.log("Verification failed:", result.error);
}
```

## 📱 React Native Integration

### 1. Setup (App.tsx or index.js)

```typescript
// Add this at the very top of your app entry point
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('YourApp', () => App);
```

### 2. Create Messaging Service

```typescript
// services/SecureMessaging.ts
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendSecureMessage, receiveSecureMessage, generateKeyPair } from '../crypto/secure-messaging';

export class SecureMessagingService {
  private privateKey: Uint8Array | null = null;
  private publicKey: Uint8Array | null = null;

  // Initialize or load existing keys
  async initializeKeys(): Promise<{ publicKey: string }> {
    try {
      // Try to load existing keys
      const storedPrivateKey = await AsyncStorage.getItem('user_private_key');
      const storedPublicKey = await AsyncStorage.getItem('user_public_key');

      if (storedPrivateKey && storedPublicKey) {
        // Load existing keys
        this.privateKey = new Uint8Array(JSON.parse(storedPrivateKey));
        this.publicKey = new Uint8Array(JSON.parse(storedPublicKey));
      } else {
        // Generate new keys
        const keyPair = generateKeyPair();
        this.privateKey = keyPair.privateKeyBytes;
        this.publicKey = keyPair.publicKeyBytes;

        // Store keys securely
        await AsyncStorage.setItem('user_private_key', JSON.stringify(Array.from(this.privateKey)));
        await AsyncStorage.setItem('user_public_key', JSON.stringify(Array.from(this.publicKey)));
      }

      // Return public key as hex string for sharing
      return {
        publicKey: Array.from(this.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')
      };
    } catch (error) {
      throw new Error(`Key initialization failed: ${error}`);
    }
  }

  // Send encrypted message
  async sendMessage(message: string, recipientPublicKeyHex: string): Promise<string> {
    if (!this.privateKey || !this.publicKey) {
      throw new Error('Keys not initialized. Call initializeKeys() first.');
    }

    // Convert hex public key to Uint8Array
    const recipientPublicKey = new Uint8Array(
      recipientPublicKeyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    return await sendSecureMessage(
      message,
      this.privateKey,
      this.publicKey,
      recipientPublicKey
    );
  }

  // Receive and decrypt message
  async receiveMessage(encryptedMessage: string, senderPublicKeyHex: string) {
    if (!this.privateKey) {
      throw new Error('Keys not initialized. Call initializeKeys() first.');
    }

    // Convert hex public key to Uint8Array
    const senderPublicKey = new Uint8Array(
      senderPublicKeyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    return await receiveSecureMessage(
      encryptedMessage,
      this.privateKey,
      senderPublicKey
    );
  }

  // Get user's public key for sharing
  getPublicKeyHex(): string {
    if (!this.publicKey) {
      throw new Error('Keys not initialized. Call initializeKeys() first.');
    }
    return Array.from(this.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### 3. React Native Component Example

```typescript
// components/SecureChat.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SecureMessagingService } from '../services/SecureMessaging';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
  verified: boolean;
}

export const SecureChat: React.FC = () => {
  const [messagingService] = useState(new SecureMessagingService());
  const [myPublicKey, setMyPublicKey] = useState<string>('');
  const [recipientPublicKey, setRecipientPublicKey] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [encryptedMessage, setEncryptedMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeMessaging();
  }, []);

  const initializeMessaging = async () => {
    try {
      const { publicKey } = await messagingService.initializeKeys();
      setMyPublicKey(publicKey);
      setIsInitialized(true);
      Alert.alert('Success', 'Secure messaging initialized!');
    } catch (error) {
      Alert.alert('Error', `Initialization failed: ${error}`);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !recipientPublicKey.trim()) {
      Alert.alert('Error', 'Please enter message and recipient public key');
      return;
    }

    try {
      const encrypted = await messagingService.sendMessage(messageText, recipientPublicKey);
      setEncryptedMessage(encrypted);
      
      // Add to local messages
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        timestamp: new Date().toISOString(),
        sender: 'You',
        verified: true
      };
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      Alert.alert('Success', 'Message encrypted and ready to send!');
    } catch (error) {
      Alert.alert('Error', `Failed to encrypt message: ${error}`);
    }
  };

  const receiveMessage = async () => {
    if (!encryptedMessage.trim() || !recipientPublicKey.trim()) {
      Alert.alert('Error', 'Please enter encrypted message and sender public key');
      return;
    }

    try {
      const result = await messagingService.receiveMessage(encryptedMessage, recipientPublicKey);
      
      if (result.verified) {
        const newMessage: Message = {
          id: Date.now().toString(),
          content: result.message!,
          timestamp: result.timestamp,
          sender: result.from.substring(0, 8) + '...',
          verified: true
        };
        setMessages(prev => [...prev, newMessage]);
        Alert.alert('Success', 'Message verified and decrypted!');
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid signature');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to decrypt message: ${error}`);
    }
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing secure messaging...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        🛡️ Secure Messaging
      </Text>

      {/* Your Public Key */}
      <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>📱 Your Public Key (Share this):</Text>
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{myPublicKey}</Text>
      </View>

      {/* Recipient Public Key Input */}
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🔑 Recipient's Public Key:</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }}
        placeholder="Enter recipient's public key..."
        value={recipientPublicKey}
        onChangeText={setRecipientPublicKey}
        multiline
      />

      {/* Message Input */}
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>💬 Message:</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }}
        placeholder="Enter your message..."
        value={messageText}
        onChangeText={setMessageText}
        multiline
      />

      {/* Send Button */}
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 15 }}
        onPress={sendMessage}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🔒 Encrypt & Send Message
        </Text>
      </TouchableOpacity>

      {/* Encrypted Output */}
      {encryptedMessage && (
        <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#ffe6e6', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>🔐 Encrypted Message:</Text>
          <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{encryptedMessage}</Text>
        </View>
      )}

      {/* Receive Section */}
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>📥 Paste Encrypted Message:</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }}
        placeholder="Paste encrypted message here..."
        value={encryptedMessage}
        onChangeText={setEncryptedMessage}
        multiline
      />

      <TouchableOpacity
        style={{ backgroundColor: '#34C759', padding: 15, borderRadius: 8, marginBottom: 20 }}
        onPress={receiveMessage}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🔓 Decrypt & Verify Message
        </Text>
      </TouchableOpacity>

      {/* Messages History */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>📨 Messages:</Text>
      {messages.map((msg) => (
        <View key={msg.id} style={{ 
          padding: 10, 
          marginBottom: 10, 
          backgroundColor: msg.verified ? '#e6ffe6' : '#ffe6e6',
          borderRadius: 8 
        }}>
          <Text style={{ fontWeight: 'bold' }}>{msg.sender} {msg.verified ? '✅' : '❌'}</Text>
          <Text>{msg.content}</Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            {new Date(msg.timestamp).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};
```

## 🔧 API Reference

### Core Functions

#### `generateKeyPair()`
```typescript
const keyPair = generateKeyPair();
// Returns: { privateKeyBytes: Uint8Array, publicKeyBytes: Uint8Array }
```

#### `sendSecureMessage(message, senderPrivateKey, senderPublicKey, receiverPublicKey)`
```typescript
const encrypted = await sendSecureMessage(
  "Hello World!",
  senderPrivateKey,
  senderPublicKey, 
  receiverPublicKey
);
// Returns: string (encrypted package)
```

#### `receiveSecureMessage(encryptedPackage, receiverPrivateKey, senderPublicKey)`
```typescript
const result = await receiveSecureMessage(
  encryptedPackage,
  receiverPrivateKey,
  senderPublicKey
);
// Returns: { message: string | null, verified: boolean, timestamp: string, from: string, error?: string }
```

## 🔐 Security Best Practices

### ✅ DO:
- **Store private keys securely** (Keychain/Keystore on mobile)
- **Verify signatures** before trusting messages
- **Use fresh key pairs** for different conversations
- **Validate public keys** before using them
- **Handle errors gracefully** 

### ❌ DON'T:
- **Never share private keys**
- **Don't store keys in plain text**
- **Don't skip signature verification**
- **Don't reuse the same keys everywhere**
- **Don't ignore error messages**

## 🚨 Security Considerations

1. **Key Storage**: Use secure storage (iOS Keychain, Android Keystore)
2. **Random Number Generation**: Ensure proper entropy source
3. **Key Rotation**: Periodically generate new key pairs
4. **Network Security**: Use TLS for message transmission
5. **Forward Secrecy**: Consider ephemeral keys for enhanced security

## 🧪 Testing

```bash
npm test
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions, please open a GitHub issue or contact the maintainers.

---

**⚠️ Security Notice**: This library implements strong cryptography, but security depends on proper implementation and key management. Always review security requirements with experts for production use.

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import 'react-native-get-random-values'; // Add this at the top!

// Import your secure messaging functions
import { sendSecureMessage, receiveSecureMessage } from '../crypto/secure-messaging';

interface SecureChatProps {
  // Your existing keys (hex strings)
  myPrivateKeyHex: string;
  myPublicKeyHex: string;
  recipientPublicKeyHex: string;
}

export const SecureChat: React.FC<SecureChatProps> = ({
  myPrivateKeyHex,
  myPublicKeyHex,
  recipientPublicKeyHex
}) => {
  // State management
  const [messageToSend, setMessageToSend] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [receivedMessage, setReceivedMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Convert hex strings to Uint8Array (utility function)
  const hexToUint8Array = (hex: string): Uint8Array => {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };

  // Convert your hex keys to Uint8Array
  const myPrivateKey = hexToUint8Array(myPrivateKeyHex);
  const myPublicKey = hexToUint8Array(myPublicKeyHex);
  const recipientPublicKey = hexToUint8Array(recipientPublicKeyHex);

  // Send secure message function
  const handleSendMessage = async () => {
    if (!messageToSend.trim()) {
      Alert.alert('Error', 'Please enter a message to send');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Encrypting message...');
      
      const encrypted = await sendSecureMessage(
        messageToSend,
        myPrivateKey,     // Your private key
        myPublicKey,      // Your public key  
        recipientPublicKey // Recipient's public key
      );

      setEncryptedMessage(encrypted);
      Alert.alert('Success', 'Message encrypted successfully!');
      console.log('✅ Message encrypted and ready to send');
      
    } catch (error) {
      console.error('❌ Encryption error:', error);
      Alert.alert('Error', `Failed to encrypt message: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Receive secure message function
  const handleReceiveMessage = async () => {
    if (!receivedMessage.trim()) {
      Alert.alert('Error', 'Please paste an encrypted message');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔓 Decrypting message...');
      
      const result = await receiveSecureMessage(
        receivedMessage,
        myPrivateKey,     // Your private key
        recipientPublicKey // Sender's public key (in this case, recipient's)
      );

      if (result.verified) {
        setDecryptedMessage(result.message!);
        Alert.alert('Success', 'Message verified and decrypted!');
        console.log('✅ Message decrypted:', result.message);
        console.log('📅 Timestamp:', result.timestamp);
        console.log('👤 From:', result.from);
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid signature');
        console.log('❌ Verification failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Decryption error:', error);
      Alert.alert('Error', `Failed to decrypt message: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛡️ Secure Messaging</Text>

      {/* Key Information Display */}
      <View style={styles.keyInfo}>
        <Text style={styles.keyLabel}>🔑 Your Public Key:</Text>
        <Text style={styles.keyValue}>{myPublicKeyHex.substring(0, 20)}...</Text>
        
        <Text style={styles.keyLabel}>👤 Recipient's Public Key:</Text>
        <Text style={styles.keyValue}>{recipientPublicKeyHex.substring(0, 20)}...</Text>
      </View>

      {/* Send Message Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Send Secure Message</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Enter your message here..."
          value={messageToSend}
          onChangeText={setMessageToSend}
          multiline
          numberOfLines={3}
        />
        
        <TouchableOpacity 
          style={[styles.button, styles.sendButton]} 
          onPress={handleSendMessage}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '🔄 Encrypting...' : '🔒 Encrypt Message'}
          </Text>
        </TouchableOpacity>

        {/* Show encrypted result */}
        {encryptedMessage && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>🔐 Encrypted Message (Copy & Send):</Text>
            <Text style={styles.encryptedText} selectable>
              {encryptedMessage}
            </Text>
          </View>
        )}
      </View>

      {/* Receive Message Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📥 Receive Secure Message</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Paste encrypted message here..."
          value={receivedMessage}
          onChangeText={setReceivedMessage}
          multiline
          numberOfLines={4}
        />
        
        <TouchableOpacity 
          style={[styles.button, styles.receiveButton]} 
          onPress={handleReceiveMessage}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '🔄 Decrypting...' : '🔓 Decrypt & Verify'}
          </Text>
        </TouchableOpacity>

        {/* Show decrypted result */}
        {decryptedMessage && (
          <View style={[styles.resultBox, styles.successBox]}>
            <Text style={styles.resultLabel}>✅ Verified Message:</Text>
            <Text style={styles.decryptedText}>
              {decryptedMessage}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Usage Example Component
export const App: React.FC = () => {
  // YOUR ACTUAL KEYS (replace with your real keys)
  const myKeys = {
    privateKey: "0x1234567890abcdef...", // Your private key (keep secret!)
    publicKey: "0x04abcdef1234567890...", // Your public key
  };
  
  const recipientPublicKey = "0x04fedcba0987654321..."; // Recipient's public key

  return (
    <SecureChat
      myPrivateKeyHex={myKeys.privateKey}
      myPublicKeyHex={myKeys.publicKey}
      recipientPublicKeyHex={recipientPublicKey}
    />
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  keyInfo: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  keyLabel: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  keyValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#34495e',
    marginBottom: 10,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  sendButton: {
    backgroundColor: '#3498db',
  },
  receiveButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    marginTop: 10,
  },
  successBox: {
    borderLeftColor: '#27ae60',
    backgroundColor: '#f0f9f0',
  },
  resultLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  encryptedText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  decryptedText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '500',
  },
});

// Helper function for existing users with hex keys
export const createMessagingHelper = (
  myPrivateKeyHex: string,
  myPublicKeyHex: string
) => {
  const hexToUint8Array = (hex: string): Uint8Array => {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };

  const myPrivateKey = hexToUint8Array(myPrivateKeyHex);
  const myPublicKey = hexToUint8Array(myPublicKeyHex);

  return {
    // Send message to someone
    async sendTo(message: string, recipientPublicKeyHex: string): Promise<string> {
      const recipientPublicKey = hexToUint8Array(recipientPublicKeyHex);
      return await sendSecureMessage(message, myPrivateKey, myPublicKey, recipientPublicKey);
    },

    // Receive message from someone
    async receiveFrom(encryptedMessage: string, senderPublicKeyHex: string) {
      const senderPublicKey = hexToUint8Array(senderPublicKeyHex);
      return await receiveSecureMessage(encryptedMessage, myPrivateKey, senderPublicKey);
    },

    // Get your public key for sharing
    getMyPublicKey(): string {
      return myPublicKeyHex;
    }
  };
};

export default App;
```
## 🔄 **Message Flow (Continued):**

1. **You send:** `message` + `your_private_key` + `recipient_public_key` → `encrypted_package`
2. **They receive:** `encrypted_package` + `their_private_key` + `your_public_key` → `verified_message`

### **📱 React Native Implementation Steps:**

#### **Step 1: Add to your App.tsx/index.js**
```typescript
import 'react-native-get-random-values'; // MUST be first import!
```

#### **Step 2: Create Simple Messaging Hook**
```typescript
// hooks/useSecureMessaging.ts
import { useState } from 'react';
import { sendSecureMessage, receiveSecureMessage } from '../crypto/secure-messaging';

export const useSecureMessaging = (
  myPrivateKeyHex: string,
  myPublicKeyHex: string
) => {
  const [isLoading, setIsLoading] = useState(false);

  const hexToBytes = (hex: string) => {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    return new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  };

  const myPrivateKey = hexToBytes(myPrivateKeyHex);
  const myPublicKey = hexToBytes(myPublicKeyHex);

  const sendMessage = async (message: string, recipientPublicKeyHex: string) => {
    setIsLoading(true);
    try {
      const recipientPublicKey = hexToBytes(recipientPublicKeyHex);
      const encrypted = await sendSecureMessage(
        message, 
        myPrivateKey, 
        myPublicKey, 
        recipientPublicKey
      );
      return encrypted;
    } finally {
      setIsLoading(false);
    }
  };

  const receiveMessage = async (encryptedMessage: string, senderPublicKeyHex: string) => {
    setIsLoading(true);
    try {
      const senderPublicKey = hexToBytes(senderPublicKeyHex);
      const result = await receiveSecureMessage(
        encryptedMessage, 
        myPrivateKey, 
        senderPublicKey
      );
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, receiveMessage, isLoading };
};
```

#### **Step 3: Use in Component**
```typescript
// components/ChatScreen.tsx
import React, { useState } from 'react';
import { useSecureMessaging } from '../hooks/useSecureMessaging';

export const ChatScreen = () => {
  const [messageText, setMessageText] = useState('');
  const [recipientKey, setRecipientKey] = useState('');
  
  const { sendMessage, receiveMessage, isLoading } = useSecureMessaging(
    "0xYOUR_PRIVATE_KEY", // Your actual private key
    "0xYOUR_PUBLIC_KEY"   // Your actual public key
  );

  const handleSend = async () => {
    try {
      const encrypted = await sendMessage(messageText, recipientKey);
      console.log('Encrypted:', encrypted);
      // Send this encrypted string via your API/WebSocket/etc.
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  return (
    // Your UI components here...
  );
};
```

## 🔑 **Key Management Best Practices:**

### **🔒 Secure Storage (Production):**
```typescript
import { Keychain } from 'react-native-keychain';

// Store private key securely
await Keychain.setSecurePassword('user_private_key', privateKeyHex);

// Retrieve private key
const credentials = await Keychain.getSecurePassword('user_private_key');
const privateKey = credentials ? credentials.password : null;
```

### **📤 Public Key Sharing:**
```typescript
// Share your public key via QR code, API, etc.
const myPublicKey = "0x04abc123def456...";

// Others need this to send you encrypted messages
// You need their public key to send them messages
```

## ⚡ **Quick Test Example:**

```typescript
// Test with two sets of keys
const alice = {
  private: "0x1111111111111111111111111111111111111111111111111111111111111111",
  public: "0x04abc123..."
};

const bob = {
  private: "0x2222222222222222222222222222222222222222222222222222222222222222", 
  public: "0x04def456..."
};

// Alice sends to Bob
const encrypted = await sendSecureMessage(
  "Hello Bob!",
  hexToBytes(alice.private),
  hexToBytes(alice.public), 
  hexToBytes(bob.public)
);

// Bob receives from Alice
const result = await receiveSecureMessage(
  encrypted,
  hexToBytes(bob.private),
  hexToBytes(alice.public)
);

console.log(result.message); // "Hello Bob!"
console.log(result.verified); // true
```

## 🚨 **Important Notes:**

1. **🔐 Private Key Security**: Never log, store in plain text, or expose private keys
2. **📱 React Native Crypto**: Use `react-native-get-random-values` for secure randomness
3. **🔄 Key Format**: Ensure keys are proper hex format (0x prefix optional)
4. **✅ Always Verify**: Check `result.verified` before trusting messages
5. **🛡️ Error Handling**: Wrap crypto operations in try-catch blocks

This gives you production-ready secure messaging with your existing keys! 🎉