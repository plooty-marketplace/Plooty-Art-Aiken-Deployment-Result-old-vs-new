### Aiken-Deployment lock assets ^Testnet Report

new aiken version v1.1.5 deployment Report




### 1. hello-world-lock ( aiken new validator)
   Results: Sucessed

   
....



1 tADA locked into the contract at:
      Tx ID: 08c0fdf4d249169c21ed715a5843171ebbbff831062d43cdd38fac90ad57f478
      Datum: {"value":{"alternative":0,"fields":["b8364cd6128b3f171210087579c99bf7b6d6820ebd3a1379b671816b"]}}


      
      ...

      
  (new code)
   hello_world-lock.ak


   
   ...


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




...



Prove:




![Screenshot 2024-11-05 at 1 56 06 AM](https://github.com/user-attachments/assets/54d0db0d-c804-43b8-bb0f-276f4d64a80c)


2. hello-world ( old Validator )

   old code

   hello_world_lock.mjs


   ...


use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/string
use cardano/transaction.{OutputReference, Transaction}
 
pub type Datum {
  owner: VerificationKeyHash,
}
 
pub type Redeemer {
  msg: ByteArray,
}
 
validator hello_world {
  spend(
    datum: Option<Datum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    trace @"redeemer": string.from_bytearray(redeemer.msg)
 
    expect Some(Datum { owner }) = datum
 
    let must_say_hello = redeemer.msg == "Hello, World!"
 
    let must_be_signed = list.has(self.extra_signatories, owner)
 
    must_say_hello? && must_be_signed?
  }
}
// ...rest of the code is unchanged
 
test hello_world_example() {
  let datum =
    Datum { owner: #"00000000000000000000000000000000000000000000000000000000" }
 
  let redeemer = Redeemer { msg: "Hello, World!" }
 
  let placeholder_utxo = OutputReference { transaction_id: "", output_index: 0 }
 
  hello_world.spend(
    Some(datum),
    redeemer,
    placeholder_utxo,
    Transaction { ..transaction.placeholder, extra_signatories: [datum.owner] },
  )
}



...


Result: fAiled deploy lock assets

Prove:


<img width="888" alt="Screenshot 2024-11-05 at 12 09 39 AM" src="https://github.com/user-attachments/assets/eafc5a40-3051-4db8-9d66-1c15128c9fba">
<img width="798" alt="Screenshot 2024-11-05 at 2 01 43 AM" src="https://github.com/user-attachments/assets/50cec794-2308-4c4a-9f02-6ec8f24f6628">
<img width="1014" alt="Screenshot 2024-11-05 at 2 01 34 AM" src="https://github.com/user-attachments/assets/b0061806-62ca-446e-b08d-f6fdc1ca56ca">



#### Hello_world_unlock.mjs     (old)


Result : Fail




old codE


...


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


Prove:



### Is the change needs for aiken-lang new versions?

1. New Features or Syntax in Aiken:
If Aiken introduces changes in how Plutus scripts are compiled or parameters are applied, having a modular structure makes it easier to adapt.
For example, if Aiken introduces new methods to apply parameters to a script, you can update only the buildScript function rather than altering the entire code.
2. Updated Dependencies or Blockchain Libraries:
Mesh SDK and Blockfrost libraries evolve over time, sometimes introducing breaking changes. With modular code, adapting to these changes would be easier since each component is more isolated.
If, for instance, Blockfrost changes how API keys are passed, you would only need to update the setupBlockchainProvider function.
3. Additional Flexibility for Different Aiken Validators:
If you’re working with multiple Aiken validators or using new features, this modular approach allows you to extend the code to handle multiple scripts or validators more easily.
The buildScript function could, for example, be modified to load different versions or types of validators, simplifying future support for multi-script applications.
4. Error Handling for More Complex Deployments:
Future Aiken versions might include new contract structures or larger validator scripts, which could lead to additional deployment complexities.
More robust error handling and modularity can help prevent unexpected deployment issues as Aiken grows in complexity.
5. Enhanced Testing and Debugging:
As Aiken’s functionality expands, it’s common to encounter bugs or want to test deployment with different parameters.
Having modular functions that you can test individually helps validate each part of the process without needing to execute the entire script, making debugging Aiken-specific issues easier.

Ease adaptations to potential future changes in Aiken’s smart contract structure.
Simplify testing and debugging as Aiken and related libraries (e.g., Mesh SDK) evolve.
Allow scalability if you need to support more complex Aiken validators or deploy multiple contracts.


### why the code run on older versu\ion but not in aiken 1.1.5 version ?

If your code runs on an older Aiken version but not on version 1.1.5, it could be due to several factors, as newer versions often bring updates, bug fixes, or breaking changes. 


1. Changes in Standard Library Functions
New or modified functions: Aiken 1.1.5 may have altered, renamed, or removed certain standard library functions. For example, functions in libraries like aiken/collection/list or cardano/transaction may have changed in structure or behavior.
Incompatibility with your code: If your code relies on specific function implementations or behaviors, those may now differ, causing unexpected issues.
2. Updates to Built-in Libraries
Library upgrades: Libraries like aiken/fuzz or cardano/assets might have updated how they handle types, parameters, or outputs. If your code uses these libraries for tasks like testing, minting, or asset handling, it may no longer work if functions now expect different types or formats.
New validation checks: The newer version may include stricter type-checking or validation, which could be causing errors if the types or structures in your code don’t match updated expectations.
3. Syntax and Language Updates
Changes in syntax or validation rules: Aiken 1.1.5 may have refined or restricted certain syntax patterns, requiring adjustments to older code to comply with new language specifications.
Enhanced error reporting: Newer versions might include more detailed error handling, which can surface issues that went unnoticed in older versions.
4. Internal Compiler or Interpreter Updates
Performance improvements or optimizations: These can sometimes cause subtle changes in behavior, especially if older versions had relaxed rules that newer versions enforce more strictly.
5. Version-Specific Bugs or Regressions
New bugs introduced in 1.1.5: Occasionally, updates unintentionally introduce new bugs, especially in complex systems like smart contract platforms. If this is the case, checking the Aiken changelog or GitHub issues page might reveal if others are encountering the same issue.

### Troubleshooting Steps
1. Check Changelog for Breaking Changes: Look at Aiken’s changelog for 1.1.5 to identify any breaking changes or updates in libraries your code relies on.
2. Test Specific Functions: Isolate functions or modules that might be affected by library updates (like list operations or transaction handling) and run tests to see where issues occur.
3. Update Code for Compatibility: Modify your code to comply with new library requirements or syntax. For example, check any changed function arguments or return types.
4. Use Aiken Support Channels: If you can’t identify the issue, checking Aiken’s community forums or GitHub might uncover others with similar compatibility issues in 1.1.5.

#### Why Need To Change Code?

1. Better Environment Variable Handling
Why: Centralizing environment variable handling ensures the code won’t run with missing critical information (like an API key).
Benefit: Reduces the risk of runtime errors due to missing configuration values and makes it easy to add more variables later if needed.
2. Modular File Reading (readFile function)
Why: Separating file reading and adding error handling makes the code more resilient to unexpected file issues (e.g., missing files or permission errors).
Benefit: Easier debugging and troubleshooting for file-related issues. Any file read error is clearly logged, making the issue’s origin obvious.
3. Modular Plutus Script Loading (loadPlutusScript function)
Why: Breaking down the loading and validation of plutus.json into its own function prevents the main code from being cluttered with file-related logic.
Benefit: This keeps the main logic focused on deployment rather than on error-checking, making it easier to add more scripts in the future or change validation rules.
4. Reusable Blockchain Provider Setup (setupBlockchainProvider function)
Why: Isolating the setup of BlockfrostProvider allows for future adjustments or replacements without affecting the main deployment logic.
Benefit: Facilitates changes or expansions to blockchain provider configurations and makes the main function easier to read.
5. Wallet Initialization Modularity (initializeWallet function)
Why: Centralizing wallet setup logic ensures any future adjustments (e.g., changing network IDs or wallet keys) happen in one place.
Benefit: Future-proofing. If you add parameters or change wallet configuration, it’s contained within this function, simplifying updates.
6. Script Building and Parameterization (buildScript function)
Why: This separates the script-building logic, making it easier to modify if you need to add parameters or change encoding formats.
Benefit: Allows for easy parameter updates and makes the code more adaptable for deploying different scripts.
7. Improved Error Handling and Logging
Why: Adding error handling in each modular function reduces the risk of uncaught errors and improves debugging by pinpointing the exact source.
Benefit: Easier troubleshooting when errors occur because they are specific to each function’s role.

## What is the Benefit of change the validator?

These changes improve:

Readability: Each function has a specific purpose, making the main deployScript function concise and easy to understand.
Reusability: With modular functions, any component can be reused or updated independently.
Maintainability: If requirements change (e.g., needing different file paths or API keys), these changes can be made in one location without modifying the core logic.
Scalability: As your project grows, having this structure helps you add complexity without cluttering the main flow, as each piece of functionality is contained in its function.

<img width="1027" alt="Screenshot 2024-11-05 at 5 28 18 AM" src="https://github.com/user-attachments/assets/bbde676a-9c9e-4f0a-af93-add630ce476b">
<img width="1016" alt="Screenshot 2024-11-05 at 5 28 03 AM" src="https://github.com/user-attachments/assets/e40e71a4-1f86-4dba-84d4-721fd2a8dd72">
