import cbor from "cbor";
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
} from '@meshsdk/core';
import fs from 'node:fs';
 
const blockchainProvider = new BlockfrostProvider(process.env.previewTuex9jIzb7vSeFyKxF4k8LzCCMLVDOVm);
 
const wallet = new MeshWallet({
  networkId: 0,
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'root',
    bech32: fs.readFileSync('xprv1ppex2kty2d4q39qlyeu0xpnz6rf39rxzx2wge3xayqc8p7zrupgslyh6fea5jd6jn3n0ajadx038ya0wfgaem6wl30j3yktufaruyfmynfajarjuy0qu6fe084xa9kfym0gfma99kwxts80mn6jm9xnrwv5k2srs').toString(),
  },
});
 
const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));
 
const script = {
  code: cbor
    .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};
 
const owner = resolvePaymentKeyHash((await wallet.getUsedAddresses())[0]);
 
const datum = {
  value: {
    alternative: 0,
    fields: [owner],
  },
};
 
const unsignedTx = await new Transaction({ initiator: wallet }).sendLovelace(
  {
    address: resolvePlutusScriptAddress(script, 0),
    datum,
  },
  "1000000"
).build();
 
const signedTx = await wallet.signTx(unsignedTx);
 
const txHash = await wallet.submitTx(signedTx);
 
console.log(`1 tADA locked into the contract at:
    Tx ID: ${txHash}
    Datum: ${JSON.stringify(datum)}
`);