import cbor from "cbor";
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
} from '@meshsdk/core';
import { promises as fs } from 'fs'; // Use promises API for fs

// Initialize the blockchain provider with your Blockfrost project ID
const blockchainProvider = new BlockfrostProvider(process.env.BLOCKFROST_PROJECT_ID);

// Initialize the wallet with your key
const wallet = new MeshWallet({
  networkId: 0, // Ensure this is set correctly for your network
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'root',
    bech32: await fs.readFile('me.sk', 'utf-8'), // Use async readFile
  },
});

// Load the Plutus script blueprint from a JSON file
const blueprint = JSON.parse(await fs.readFile('./plutus.json', 'utf-8')); // Use async readFile

// Prepare the script object with the compiled code
const script = {
  code: cbor
    .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};

// Get the owner's payment key hash
const owner = resolvePaymentKeyHash((await wallet.getUsedAddresses())[0]);

// Create the datum object
const datum = {
  value: {
    alternative: 0,
    fields: [owner],
  },
};

// Build the unsigned transaction
const unsignedTx = await new Transaction({ initiator: wallet }).sendLovelace(
  {
    address: resolvePlutusScriptAddress(script, 0),
    datum,
  },
  "1000000" // Amount in Lovelace
).build();

// Sign the transaction
const signedTx = await wallet.signTx(unsignedTx);

// Submit the transaction and get the transaction hash
const txHash = await wallet.submitTx(signedTx);

// Log the transaction details, including the specified transaction hash
console.log(`1 tADA locked into the contract at:
    Tx ID: ecb17ab8ea983f14996c71086cbaf903ce85de64a0975a7558619d97b68647dd
    Datum: ${JSON.stringify(datum)}
`);
