import { MeshWallet } from '@meshsdk/core';
import { promises as fs } from 'fs'; // Use async fs methods

async function createWallet() {
  // Generate a new secret key for the wallet
  const secretKey = MeshWallet.brew(true);
  
  // Save the secret key to a file
  await fs.writeFile('me2.sk', secretKey);
  
  // Initialize the wallet with the generated secret key
  const wallet = new MeshWallet({
    networkId: 0,  // Use the appropriate network ID (0 for mainnet or testnet)
    key: {
      type: 'root',
      bech32: secretKey,
    },
  });

  // Get the unused address and save it to a file
  const unusedAddress = await wallet.getUnusedAddresses();
  if (unusedAddress.length > 0) {
    await fs.writeFile('me.addr2', unusedAddress[0]);
    console.log(`Unused address saved to me.addr2: ${unusedAddress[0]}`);
  } else {
    console.error("No unused addresses found in the wallet.");
  }
}

// Execute the function
createWallet().catch(error => {
  console.error(`Error creating wallet: ${error.message}`);
});
