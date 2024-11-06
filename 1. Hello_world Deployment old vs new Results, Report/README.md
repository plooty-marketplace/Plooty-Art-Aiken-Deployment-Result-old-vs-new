### Aiken-Deployment lock assets

new aiken version v1.1.5 deployment




### 1. hello-world ( aiken new validator)
   Results: Sucessed

   
Smart Contract Deployed: 08c0fdf4d249169c21ed715a5843171ebbbff831062d43cdd38fac90ad57f478


   
....

1 tADA locked into the contract at:
      Tx ID: 08c0fdf4d249169c21ed715a5843171ebbbff831062d43cdd38fac90ad57f478
      Datum: {"value":{"alternative":0,"fields":["b8364cd6128b3f171210087579c99bf7b6d6820ebd3a1379b671816b"]}}
      
      
...

(new code)
 

Prove:

1. https://preview.cardanoscan.io/address/00ad0063e0166ee5f55e87d0178c71bb4dcb23ced77288d49b6cd6f79ff94a5f5f7ad5eceda9a4abd95faaba5fad05f3e6712a37181c94b955

<img width="1035" alt="Screenshot 2024-11-05 at 1 56 06 AM" src="https://github.com/user-attachments/assets/1406079c-816f-4a83-ad20-baed2d544610">


2. hello-world ( old Validator )

# 3. hello_world-unlock.mjs

(new Code)

...

import cbor from "cbor";
import { BlockfrostProvider, MeshWallet } from '@meshsdk/core';
import { applyParamsToScript } from "@meshsdk/core-csl";
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

// Initialize the blockchain provider with Blockfrost API key
const blockchainProvider = new BlockfrostProvider(process.env.BLOCKFROST_PROJECT_ID);

async function deployScript() {
  // Initialize the wallet
  const wallet = new MeshWallet({
    networkId: 0, // Set to 1 if deploying on mainnet
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
      type: 'root',
      bech32: fs.readFileSync('me.sk').toString(),
    },
  });

  // Load the compiled Plutus script
  const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));

  // Define the script
  const script = {
    code: cbor
      .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
      .toString("hex"),
    version: "V3",
  };

  // Apply parameters to the script if needed
  // Example: const scriptWithParams = applyParamsToScript(script, { param1: value1, param2: value2 });

  console.log("Script loaded and wallet initialized successfully.");
}

deployScript().catch(console.error);

...


prove:

1.
   <img width="810" alt="Screenshot 2024-11-05 at 4 37 59 AM" src="https://github.com/user-attachments/assets/5d231865-dbb7-4e1f-a25d-e5165188278a">

2. <img width="1041" alt="Screenshot 2024-11-05 at 4 38 09 AM" src="https://github.com/user-attachments/assets/eabb928a-a2a7-4347-b644-6b141de94cff">


### 1. old code


Result: fAiled deploy lock assets


Prove:

1.

<img width="1014" alt="Screenshot 2024-11-05 at 2 01 34 AM" src="https://github.com/user-attachments/assets/3336bd4c-6151-474b-a364-a84d8b29f23d">

2. 

<img width="798" alt="Screenshot 2024-11-05 at 2 01 43 AM" src="https://github.com/user-attachments/assets/2100ad5e-bb34-4f23-a7e4-112ca5c1b030">

3.

<img width="1090" alt="Screenshot 2024-11-05 at 12 09 45 AM" src="https://github.com/user-attachments/assets/908c6d07-f59f-4f76-b536-6c9e466e970f">


hello-world-unlock.mjs (old code )

....

import cbor from "cbor";
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
} from '@meshsdk/core';
import { applyParamsToScript } from "@meshsdk/core-csl";
import fs from 'node:fs';
 
const blockchainProvider = new BlockfrostProvider(process.env.BLOCKFROST_PROJECT_ID);
 
const wallet = new MeshWallet({
  networkId: 0,
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'root',
    bech32: fs.readFileSync('me.sk').toString(),
  },
});
 
const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));
 
const script = {
  code: cbor
    .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};
 
async function fetchUtxo(addr) {
  const utxos = await blockchainProvider.fetchAddressUTxOs(addr);
  return utxos.find((utxo) => {
    return utxo.input.txHash == process.argv[2];
  });
}
 
const utxo = await fetchUtxo(resolvePlutusScriptAddress(script, 0))
 
const address = (await wallet.getUsedAddresses())[0];
 
const owner = resolvePaymentKeyHash(address);
 
const datum = {
  alternative: 0,
  fields: [owner],
};
 
const redeemer = {
  data: {
    alternative: 0,
   fields: ['Hello, World!'],
  },
};
 
const unsignedTx = await new Transaction({ initiator: wallet })
  .redeemValue({
    value: utxo,
    script: script,
    datum: datum,
    redeemer: redeemer,
  })
  .sendValue(address, utxo)
  .setRequiredSigners([address])
  .build();
 
const signedTx = await wallet.signTx(unsignedTx, true);
 
const txHash = await wallet.submitTx(signedTx);
 
console.log(`1 tADA unlocked from the contract at:
    Tx ID: ${txHash}
    Redeemer: ${JSON.stringify(redeemer)}
`);

....


Rewsult: Fail




### 5. new unlock code changes:


what changes can made upper code new code ?


Changes
loadEnvVar Function: This function centralizes environment variable loading and validation, making it easy to reuse and modify for any environment variables needed in the future.

readFile Function: The file reading logic is isolated in a separate function, allowing improved error handling and reuse.

loadPlutusScript Function: This function encapsulates loading and validating plutus.json, keeping the main logic cleaner.

setupBlockchainProvider Function: This function sets up the BlockfrostProvider, making the main code easier to read and maintain.

initializeWallet Function: This isolates wallet initialization, enabling parameterization of network ID or other wallet-specific configurations in one place.

buildScript Function: The buildScript function loads the script from the blueprint, encodes it with cbor, and applies parameters if provided, streamlining the main deployment function.

Error Handling: Each function includes specific error handling, making it easier to identify the source of errors.

This refactored version is modular, making it easier to test, update, and debug individual components.

