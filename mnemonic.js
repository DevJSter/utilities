import { Wallet } from 'ethers';

// 12-word BIP39 mnemonic (can generate via ethers.Wallet.createRandom())
const mnemonic = "announce room limb pattern dry unit scale effort smooth jazz weasel alcohol";
const walletMnemonic = Wallet.fromPhrase(mnemonic);

const walletPrivateKey = new Wallet(walletMnemonic.privateKey);

console.log(walletPrivateKey)
console.log('Private Key:', walletMnemonic.privateKey);
console.log('Public Address:', walletMnemonic.address);
