import fs from "fs";
import axios from "axios";
import { Blockfrost, Lucid, fromText } from "lucid-cardano";
import { BlockfrostProvider,Transaction,AppWallet } from '@meshsdk/core';
import { config } from "./config.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config({
  path: ".env",
});

const blockchainProvider = new BlockfrostProvider(config.BLOCKFROST_API_KEY);
const wallet = new AppWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: 'mnemonic',
        words: ["bronze","company","inspire","click","appear","grocery","all","plastic","pear","rule","bomb","renew","toilet","surge","bring","dumb","benefit","cry","silly","scene","manual","cannon","rely","since"],
    },
});

export function saveData(content) {
  fs.writeFileSync(__dirname + "/database/data.json", JSON.stringify(content));
}

export function loadData() {
  return fs.existsSync(__dirname + "/database/data.json")
    ? JSON.parse(fs.readFileSync(__dirname + "/database/data.json").toString())
    : undefined;
}

export const blockFrost = new Blockfrost(
  config.BLOCKFROST_API_URL,
  config.BLOCKFROST_API_KEY
);

export const lucid = await Lucid.new(
  blockFrost,
  config.CARDANO_NETWORK == 0 ? config.PREVIEW_OR_PREPROD : "Mainnet"
);

lucid.selectWalletFromPrivateKey(process.env.PRIVATE_KEY);

export const sendAdaFromProject = async (addr, amt) => {
  try {
    console.log("sendAdaFromProject,", addr, await lucid.wallet.address());

    const amount = BigInt(Number(amt) * 1000000);
    const tx = await lucid
      .newTx()
      .payToAddress(addr, { lovelace: amount })
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("txHash::: ", txHash);
    return txHash;
  } catch (error) {
    console.log(error, ">>>>>>>>>Error in sending ADA");
    return error;
  }
};

export const withdrawFromProject = async (addr, amt, amt1, amt2, amt3) => {
  try {
    console.log("sendTokenFromProject,", addr, await lucid.wallet.address());

    const amount = BigInt(Number(amt) * 1000000);

    let unit = new Array(3);

    unit[0] = config.POLICY_ID[0] + fromText(config.TOKEN_NAME[0]);
    unit[1] = config.POLICY_ID[1] + fromText(config.TOKEN_NAME[1]);
    unit[2] = config.POLICY_ID[2] + fromText(config.TOKEN_NAME[2]);

    const tx = await lucid
      .newTx()
      .payToAddress(addr, { lovelace: amount })
      .payToAddress(addr, { [unit[0]]: amt1 })
      .payToAddress(addr, { [unit[1]]: amt2 })
      .payToAddress(addr, { [unit[2]]: amt3 })
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("txHash::: ", txHash);
    return txHash;
  } catch (error) {
    console.log(error, ">>>>>>>>>Error in sending ADA");
    return undefined;
  }
};

export const mint = async () => {
  console.log("Minting >>>>>>>>>>>");
  const { paymentCredential } = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  );

  const mintingPolicy = lucid.utils.nativeScriptFromJson({
    type: "all",
    scripts: [
      { type: "sig", keyHash: paymentCredential.hash },
      {
        type: "before",
        slot: lucid.utils.unixTimeToSlot(Date.now() + 1000000),
      },
    ],
  });

  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);
  console.log("Policy ID:  ", policyId);

  const unit = policyId + fromText("KONDA");

  const tx = await lucid
    .newTx()
    .mintAssets({ [unit]: 10000n })
    .validTo(Date.now() + 200000)
    .attachMintingPolicy(mintingPolicy)
    .complete();

  const signedTx = await tx.sign().complete();

  const txHash = await signedTx.submit();
};

export const Withdraw = async (amount) => { 
  const tx = new Transaction({ initiator: wallet }).sendLovelace(
    config.DEMO_WALLET,
    (amount * 1000000).toString()
  );
  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);
}


const fetchPendingData = async () => {
  
}

export async function checkTransaction() {
  const instance = await axios.create({
    baseURL: config.BLOCKFROST_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'project_id': config.BLOCKFROST_API_KEY
    }
  });
  const transactions = instance.get('/addresses/addr_test1vq6wpgx36vestuh4p68yvqcxadd5mj7r9qztzev5gyegxggffwej8/transactions', { order: "asc" }).then(response => response.data).catch(error => {
    console.log(error);
    return [];
  });
  return transactions;
}

export const filterTransaction = async () => {
  setInterval(async () => {
    const hashlist = await checkTransaction();
    console.log(hashlist);
    console.log("++++++++++++++")
  }, 20000)
}
// export const getOwnerBalance = async (address) => {
//   try {

//   }
// }