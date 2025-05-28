import { Wallet } from 'ethers';
import fs from 'fs';

// Infinite loop
while (true) {
  // Generate new random wallet
  const wallet = Wallet.createRandom();

  // Get mnemonic phrase
  const mnemonic = wallet.mnemonic.phrase;

  // Append mnemonic to safe.txt with a newline
  fs.appendFileSync('safe.txt', mnemonic + '\n');

  console.log('Mnemonic generated and saved:', mnemonic);
}

