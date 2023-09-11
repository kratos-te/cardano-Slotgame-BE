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

const MNEMONIC_STR = process.env.MNEMONIC;
const MNEMONIC = MNEMONIC_STR.split(",")


const blockchainProvider = new BlockfrostProvider(config.BLOCKFROST_API_KEY);
const wallet = new AppWallet({
    networkId: 1,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: MNEMONIC
    },
});

export const sendFee = async (ada_count, nebula_count, dum_count, konda_count, snek_count) => {
    const nebulaAmount = ada_count + nebula_count + dum_count + konda_count + snek_count
   console.log("amount", nebulaAmount)
   const tx = new Transaction({ initiator: wallet });

   if (ada_count !== 0) {
     tx.sendLovelace(config.NEBULA_ADDRESS, (nebulaAmount * 1000000).toString());
   } 
   if (dum_count !== 0) {
     tx.sendLovelace(config.DUM_ADDRESS, (dum_count * 1000000).toString());
   }
 
   if (konda_count !== 0) {
     tx.sendLovelace(config.KONDA_ADDRESS, (konda_count * 1000000).toString());
   }
 
   if (snek_count !== 0) {
     tx.sendLovelace(config.SENK_ADDRESS, (snek_count * 1000000).toString());
   }
 
   const unsignedTx = await tx.build();
   console.log("unsignedTx", unsignedTx);
 
   const signedTx = await wallet.signTx(unsignedTx);
   console.log("signedTx", signedTx);
 
   const txHash = await wallet.submitTx(signedTx);
   return txHash.toString();
};

export const Withdraw = async (ada,  dum, nebula, konda, snek, address) => {
    if(ada > 0){

        const tx = new Transaction({initiator: wallet})
        tx.sendLovelace(address, (ada * 1000000).toString())
        .sendAssets(address, [
            {
                unit: config.DUM_POLICY_ID,
                quantity: (dum*100).toString(),
            },
            {
                unit: config.NEBULA_POLICY_ID,
                quantity: (nebula * 100000000).toString(),
            },
            {
                unit: config.KONDA_POLICY_ID,
                quantity: konda.toString(),
            },
            {
                unit: config.SNEK_POLICY_ID,
                quantity: snek.toString(),
            }
        ]);
        const unsignedTx = await tx.build();
        const signedTx = await wallet.signTx(unsignedTx);
        const txHash = await wallet.submitTx(signedTx);
        return txHash.toString();
    } else {
        const tx = new Transaction({initiator: wallet})
        tx.sendLovelace(address, (1 * 1000000).toString())
        .sendAssets(address, [
            {
                unit: config.DUM_POLICY_ID,
                quantity: (dum*100).toString(),
            },
            {
                unit: config.NEBULA_POLICY_ID,
                quantity: (nebula * 100000000).toString(),
            },
            {
                unit: config.KONDA_POLICY_ID,
                quantity: konda.toString(),
            },
            {
                unit: config.SNEK_POLICY_ID,
                quantity: snek.toString(),
            },
        ]);
        const unsignedTx = await tx.build();
        const signedTx = await wallet.signTx(unsignedTx);
        const txHash = await wallet.submitTx(signedTx);
        return txHash.toString();
    }
};