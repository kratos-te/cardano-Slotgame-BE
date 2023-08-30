import {BlockfrostProvider, Transaction, AppWallet} from "@meshsdk/core";
import {config} from "./config.js";
import dotenv from "dotenv";

dotenv.config({
    path: ".env",
});
const words = process.env.DB_CONNECTION;
console.log("words", words);

const Withdraw = async () => {
    const blockchainProvider = new BlockfrostProvider(config.BLOCKFROST_API_KEY);
    const wallet = new AppWallet({
        networkId: 1,
        fetcher: blockchainProvider,
        submitter: blockchainProvider,
        key: {
            type: "mnemonic",
            words: [
                "stereo", "apple", "loan", "soda", "feel", "bid", "harsh", "lab", "palace", "maze", "eye", "cereal", "south", "tide", "primary", "dream", "pelican", "pink", "cupboard", "phone", "combine", "torch", "fee", "chimney"
            ],
        },
    });
    console.log("balance", wallet.getPaymentAddress());
    // console.log("transaction",wallet)
    const tx = new Transaction({initiator: wallet}).sendLovelace(config.DEMO_WALLET, "500000")
    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    console.log("hash", txHash);
};

Withdraw();
