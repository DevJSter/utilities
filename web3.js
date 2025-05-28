// import { ethers } from "ethers";

// // connect to your local reth node
// const provider = new ethers.JsonRpcProvider("http://localhost:8545");

// // use your private key here (for test/dev only)
// const wallet = new ethers.Wallet("0xc3ad6285692204ed4c39ab6d7ca1b70b1af4a7f76b9414acd282d38fe68a6328", provider);

// // send transaction
// async function sendTx() {
//   const tx = await wallet.sendTransaction({
//     to: "0xcaBA8c7aA6b85B557f765e0E0E31f2191AdFa829",
//     value: ethers.parseEther("0.000001"),
//   });
//   console.log("Tx sent:", tx.hash);
// }
// while (true) {
//   console.log("Sending tx...");

//   await sendTx();
// }

const fs = require('fs');
const words = require('an-array-of-english-words');
const leoProfanity = require('leo-profanity');

// Filter out profanities
const safeWords = words.filter(word => !leoProfanity.check(word));

console.log(`Total words: ${words.length}`);
console.log(`Profane words removed: ${words.length - safeWords.length}`);
console.log(`Clean words remaining: ${safeWords.length}`);

// Save clean word list to safe.txt
fs.writeFileSync('safe.txt', safeWords.join('\n'), 'utf8');

console.log('Clean word list saved to safe.txt ✅');

