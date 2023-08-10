import { BlockfrostProvider,Transaction,AppWallet } from '@meshsdk/core';
import { config } from "./config.js";

const Withdraw = async () => {

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
    console.log("balance", wallet.getPaymentAddress())
    // console.log("transaction",wallet)
    const tx = new Transaction({ initiator: wallet }).sendLovelace(
        config.DEMO_WALLET,
        "100000000"
    );
      const unsignedTx = await tx.build();
      const signedTx = await wallet.signTx(unsignedTx);
      const txHash = await wallet.submitTx(signedTx);
      console.log("hash", txHash)
}

Withdraw()
