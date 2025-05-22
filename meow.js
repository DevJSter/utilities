
// Enhanced sendMessage function with better debugging
const sendMessage = async () => {
  if (
    dataChannelRef.current &&
    dataChannelRef.current.readyState === "open" &&
    message.trim() !== ""
  ) {
    console.log("Sending message...");
    
    // Get the current message to send
    const messageToSend = message.trim();
    
    // Create the basic message object
    let messageObject;
    
    // Try to encrypt if we have the peer's public key
    if (sendersPublicKey && publicKey) {
      try {
        console.log("Keys available for encryption:", {
          myKey: publicKey.substring(0, 10) + "...",
          peerKey: sendersPublicKey.substring(0, 10) + "..."
        });
        
        // Create message object to encrypt (as a string)
        const messageToEncrypt = JSON.stringify({
          text: messageToSend,
          timestamp: Date.now()
        });
        console.log("Message to encrypt:", messageToEncrypt);
        
        // Encrypt the message
        const encryptedPayload = encryptValue(
          messageToEncrypt, 
          publicKey, 
          sendersPublicKey
        );
        
        // Create message object with encrypted payload
        messageObject = {
          publicKey: publicKey,
          encryptedPayload: encryptedPayload
        };
        
        console.log("Created encrypted message");
        
        // Test decryption immediately to verify it works
        try {
          const testDecrypt = decryptValue(
            encryptedPayload,
            publicKey,
            sendersPublicKey
          );
          console.log("Test decryption result:", testDecrypt);
        } catch (testError) {
          console.error("Test decryption failed:", testError);
        }
      } catch (error) {
        console.error("Encryption failed:", error);
        // Fall back to unencrypted if encryption fails
        messageObject = {
          text: messageToSend,
          publicKey: publicKey
        };
      }
    } else {
      console.log("Missing keys for encryption:", {
        myKey: !!publicKey,
        peerKey: !!sendersPublicKey
      });
      // No public key, send unencrypted
      messageObject = {
        text: messageToSend,
        publicKey: publicKey
      };
    }

    // Send the message (encrypted or not)
    try {
      const messageString = JSON.stringify(messageObject);
      
      // Log a preview of the message
      const preview = messageString.length > 100 
        ? messageString.substring(0, 100) + "..." 
        : messageString;
      console.log("Sending message object:", preview);
      
      dataChannelRef.current.send(messageString);

      // Update chat with your message
      setChat((prev) => [...prev, `You: ${messageToSend}`]);
      setMessage("");
      
      console.log("Message sent successfully!");
    } catch (sendError) {
      console.error("Error sending message:", sendError);
      Alert.alert("Failed to send message", "There was an error sending your message");
    }
  } else {
    if (!dataChannelRef.current) {
      console.error("Data channel is null");
    } else if (dataChannelRef.current.readyState !== "open") {
      console.error("Data channel not open, state:", dataChannelRef.current.readyState);
    }
    Alert.alert("Cannot send message", "Please check your connection and try again.");
  }
};