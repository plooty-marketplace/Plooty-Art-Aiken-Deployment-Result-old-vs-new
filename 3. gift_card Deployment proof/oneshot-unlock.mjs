import cbor from "cbor";
import fs from 'node:fs';
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
} from '@meshsdk/core';

// Load and check for BLOCKFROST_PROJECT_ID environment variable
const blockfrostProjectId = process.env.BLOCKFROST_PROJECT_ID;
if (!blockfrostProjectId) {
  throw new Error("BLOCKFROST_PROJECT_ID environment variable is not set.");
}

// Initialize Blockfrost provider
const blockchainProvider = new BlockfrostProvider(blockfrostProjectId);

// Initialize wallet
const wallet = new MeshWallet({
  networkId: 0, // Adjust network ID as necessary (e.g., 1 for mainnet)
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'root',
    bech32: fs.readFileSync('me.sk').toString(),
  },
});

// Load Plutus script blueprint and parse the JSON file
const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));

// Prepare the script object
const script = {
  code: cbor
    .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};

// Define TxHash as a constant
const TxHash = "26b91d6b48c1198fe4f5de22d757bf3719b387fa7b36d4f45e27bf00d78b26fc";

// Fetch UTXO for a given address based on the predefined TxHash
async function fetchUtxo(addr) {
  const utxos = await blockchainProvider.fetchAddressUTxOs(addr);

  // Log fetched UTXOs to verify structure and contents
  console.log("Fetched UTXOs:", utxos);

  const matchingUtxo = utxos.find((utxo) => utxo.input.txHash === TxHash);

  if (!matchingUtxo) {
    throw new Error(`UTXO not found for TxHash: ${TxHash}`);
  }

  console.log("Matching UTXO:", matchingUtxo); // Log the matching UTXO to verify

  return matchingUtxo;
}

// Main function to execute the transaction
async function executeTransaction() {
  try {
    const scriptAddress = resolvePlutusScriptAddress(script, 0);
    const utxo = await fetchUtxo(scriptAddress);

    // Check if utxo and its properties are defined
    if (!utxo || !utxo.value) {
      throw new Error("UTXO or UTXO value is undefined.");
    }

    const address = (await wallet.getUsedAddresses())[0];
    const owner = resolvePaymentKeyHash(address);

    // Define datum and redeemer
    const datum = {
      alternative: 0,
      fields: [owner],
    };

    const redeemer = {
      data: {
        alternative: 0,
        fields: ['OneShot'],
      },
    };

    // Create an unsigned transaction
    const unsignedTx = await new Transaction({ initiator: wallet })
      .redeemValue({
        value: utxo,
        script: script,
        datum: datum,
        redeemer: redeemer,
      })
      .sendValue(address, utxo.value) // Send the value of the UTXO
      .setRequiredSigners([address])
      .build();

    // Sign the transaction
    const signedTx = await wallet.signTx(unsignedTx, true);

    // Submit the transaction to the blockchain
    const txHash = await wallet.submitTx(signedTx);

    // Output the transaction details
    console.log(`1 tADA unlocked from the contract at:
    Tx ID: ${txHash}
    Redeemer: ${JSON.stringify(redeemer)}`);
  } catch (error) {
    console.error(`Error executing transaction: ${error.message}`);
  }
}

// Execute the transaction
executeTransaction();
