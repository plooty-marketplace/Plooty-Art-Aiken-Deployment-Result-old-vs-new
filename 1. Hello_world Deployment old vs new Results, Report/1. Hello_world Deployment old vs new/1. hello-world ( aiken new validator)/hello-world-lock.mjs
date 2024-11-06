import cbor from "cbor";
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
} from '@meshsdk/core';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

// Initialize the blockchain provider with the Blockfrost API key
const blockchainProvider = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY);

async function deploy() {
  // Initialize the wallet
  const wallet = new MeshWallet({
    networkId: 0, // 0 for testnet, 1 for mainnet
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
      type: 'root',
      bech32: fs.readFileSync('me.sk').toString(),
    },
  });

  // Load and prepare the Plutus script
  const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));
  const script = {
    code: cbor
      .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
      .toString("hex"),
    version: "V3",
  };

  // Resolve the payment key hash of the first used address
  const owner = resolvePaymentKeyHash((await wallet.getUsedAddresses())[0]);

  // Set up the datum for the transaction
  const datum = {
    value: {
      alternative: 0,
      fields: [owner],
    },
  };

  // Build the transaction to send 1 tADA (1,000,000 Lovelace)
  const unsignedTx = await new Transaction({ initiator: wallet }).sendLovelace(
    {
      address: resolvePlutusScriptAddress(script, 0),
      datum,
    },
    "1000000"
  ).build();

  // Sign and submit the transaction
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  // Output transaction details
  console.log(`1 tADA locked into the contract at:
      Tx ID: ${txHash}
      Datum: ${JSON.stringify(datum)}
  `);
}

deploy().catch(console.error);
