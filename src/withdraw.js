import { BlockfrostProvider,Transaction,AppWallet } from '@meshsdk/core';
import { config } from "./config.js";

const Withdraw = async () => {
    console.log("BLOCKFROST_API_KEY", config.BLOCKFROST_API_KEY)

    const blockchainProvider = new BlockfrostProvider("mainnetXrd51cdwgrtlzATYPVGrvK02fuVUxFZu");
    const wallet = new AppWallet({
        networkId: 1,
        fetcher: blockchainProvider,
        submitter: blockchainProvider,
        key: {
            type: 'mnemonic',
            words: ["stereo","apple","loan","soda","feel","bid","harsh","lab","palace","maze","eye","cereal","south","tide","primary","dream","pelican","pink","cupboard","phone","combine","torch","fee","chimney"],
        },
    });


    console.log("balance", wallet.getPaymentAddress())
    console.log("transaction",wallet)
    const tx = new Transaction({ initiator: wallet }).sendLovelace(
        "addr1qxewelxyaux3zpslsd4ekqwntzdqj2munxf0352kqqgpxq0pgkd92c58lwg7x5sttz38remn3hxwqgcggpxlp8vgl56qv50385",
        "15000000"
    );
      const unsignedTx = await tx.build();
      const signedTx = await wallet.signTx(unsignedTx);
      const txHash = await wallet.submitTx(signedTx);
      console.log("hash", txHash)
}

Withdraw()
