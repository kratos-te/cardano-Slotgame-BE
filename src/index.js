import express from "express";
import axios from "axios";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron"

import { Withdraw, checkTransaction, loadData, mint, saveData, withdrawFromProject, filterTransaction } from "./utils.js";
import { init, addUser, loadUserData, updateUserData, savePendingData, getPendingData, updatePendingData,deletePendingData } from "./db.js";
import { config } from "./config.js";

// load the environment variables from the .env file
dotenv.config({
  path: ".env",
});

const app = express();
const server = http.createServer(app);
server.timeout = 180000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const TOTAL = 7;
init()
cron.schedule("*/10 * * * * *", async function () {
  const instance = await axios.create({
    baseURL: config.BLOCKFROST_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'project_id': config.BLOCKFROST_API_KEY
    }
  });
  const transactions = await instance.get('/addresses/addr_test1vq6wpgx36vestuh4p68yvqcxadd5mj7r9qztzev5gyegxggffwej8/transactions?order=desc').then(response => response.data).catch(error => {
    console.log(error);
    return [];
  });
  // console.log("txdata", transactions)
  (transactions.forEach(async(transaction) => {
    const hash = transaction.tx_hash.toString()
    const pendingData = await getPendingData(hash)
    console.log("hash",hash, ":", pendingData)
    if (pendingData && pendingData.action == "deposit" ) {
      console.log("deposit", pendingData.action)

      const hashTable = pendingData.hash
      console.log( "hashs",  hashTable)
      const hashData = await instance.get('/txs/' + hashTable).then(response => response.data).catch(error => {
        console.log(error);
        return [];
      });
      if (hashData.valid_contract == true) {
        const status = "confirmed"
        const updatePending = await updatePendingData(hashTable, status)
      }
      if (pendingData && pendingData.status == "confirmed") {
        const data = await loadUserData(pendingData.from_address);
        if (!data) {
          const ada_deposited = parseFloat(pendingData.ada_balance) + 0
          const dum_deposited = parseFloat(pendingData.dum_balance) + 0
          const nebula_deposited = parseFloat(pendingData.nebula_balance) + 0
          const konda_deposited = parseFloat(pendingData.konda_balance) + 0
          console.log("DATA:  ", data);
          const dataResult = {
            nebula_balance: nebula_deposited,
            dum_balance: dum_deposited,
            konda_balance: konda_deposited,
            ada_balance: ada_deposited,
          };
          const userData = await addUser(pendingData.from_address, ada_deposited, dum_deposited, nebula_deposited, konda_deposited)
        } else {
          const ada_deposited = parseFloat(pendingData.ada_balance) + parseFloat(data.ada_balance)
          const dum_deposited = parseFloat(pendingData.dum_balance) + parseFloat(data.dum_balance)
          const nebula_deposited = parseFloat(pendingData.nebula_balance) + parseFloat(data.nebula_balance)
          const konda_deposited = parseFloat(pendingData.konda_balance) + parseFloat(data.konda_balance)
          console.log("DATA:  ", data);
          const dataResult = {
            nebula_balance: nebula_deposited,
            dum_balance: dum_deposited,
            konda_balance: konda_deposited,
            ada_balance: ada_deposited,
          };
          const deletePending = await deletePendingData(pendingData.hash)
          if (data.address == pendingData.from_address) {
            const updateData = await updateUserData(pendingData.from_address, dataResult)
          } else {
            const userData = await addUser(pendingData.from_address, ada_balance, dum_balance, nebula_balance, konda_balance)
          }
        }
      }
    }
    if (pendingData && pendingData.action == "withdraw") {
      console.log("withdraw", pendingData.action)
      const hashTable = pendingData.hash
      console.log( "hashs",  hashTable)
      const hashData = await instance.get('/txs/' + hashTable).then(response => response.data).catch(error => {
        console.log(error);
        return [];
      });
      if (hashData.valid_contract == true) {
        const status = "confirmed"
        const updatePending = await updatePendingData(hashTable, status)
      }
      if (pendingData && pendingData.status == "confirmed") {
        const data = await loadUserData(pendingData.to_address);
        console.log( "data", data)
        const ada_withdraw = parseFloat(data.ada_balance) - parseFloat(pendingData.ada_balance)
        const dum_withdraw = parseFloat(data.dum_balance) - parseFloat(pendingData.dum_balance)
        const nebula_withdraw = parseFloat(data.nebula_balance) - parseFloat(pendingData.nebula_balance)
        const konda_withdraw = parseFloat(data.konda_balance) - parseFloat(pendingData.konda_balance)

        const dataResult = {
          nebula_balance: nebula_withdraw,
          dum_balance: dum_withdraw,
          konda_balance: konda_withdraw,
          ada_balance: ada_withdraw,
        };
        const deletePending = await deletePendingData(pendingData.hash)
        if (data.ada_balance <= pendingData.ada_balance) {
          console.log("ADA Amount Exceed");
          res.send(JSON.stringify(-100));
        } else {
          console.log("Good", data.ada_balance > pendingData.ada_balance )
          const updateData = await updateUserData(pendingData.to_address, dataResult)
        }
      }
    }
  }))
  

})

app.get("/", async (req, res) => {
  res.send(JSON.stringify(0));
});

app.post("/deposit", async (req, res) => {

  const from_address = req.body.address;
  const to_address = req.body.DEMO_WALLET;
  const hash = req.body.txHash;
  const ada_balance = req.body.ada_balance;
  const dum_balance = req.body.dum_balance;
  const nebula_balance = req.body.nebula_balance;
  const konda_balance = req.body.konda_balance;
  const txhash = req.body.txHash;

    if (to_address !== config.OWNER_WALLET) { 
      res.status(400).send("Invalid target address");
      return;
    }
  
    const status = "Checking"
    const addPendingData = await savePendingData(from_address, to_address, ada_balance, dum_balance, nebula_balance, konda_balance, txhash, status, "deposit" );
  // Await until pending Tx will remove in DB
  await new Promise(async (resolve, reject) => { 
    const itvl = setInterval(async () => {
      try {
        const pendingData = await getPendingData(txhash)
        // console.log("Check", pendingData)
        if (pendingData == null) {
          res.send(JSON.stringify(200));
          clearInterval(itvl);
          resolve(1);
        }
      } catch (e) {
        console.error(e);
        res.status(500).send("DB operation failed");
        clearInterval(itvl);
        reject(e);
      }
    }, 10000);
  });
});

app.post("/play", async (req, res) => {
  try {
    const wallet = req.body.wallet;
    const token = req.body.token;
    const scores = req.body.score;

    const score = parseFloat(scores);

    console.log("===============================api data", wallet, token, score)

    const data = await loadUserData(wallet);

    // let database = data.db;
    // let nebulaBase = data.nebula;
    // let dumBase = data.dum;
    // let kondaBase = data.konda;
    // let adaBase = data.ada;

    let address = data.address;
    let nebulaBase = data.nebula_balance;
    let dumBase = data.dum_balance;
    let kondaBase = data.konda_balance;
    let adaBase = data.ada_balance;



    // const index = database.findIndex((obj) => obj.wallet === wallet);

    if (address !== wallet) {
      res.send(JSON.stringify(501));
      return;
    } else if (
      !(
        (token === "ada" &&
          adaBase > score &&
          adaBase > 1) ||
        (token === "nebula" &&
        nebulaBase > score &&
        adaBase > 1) ||
        (token === "dum" &&
        dumBase > score &&
        adaBase > 1) ||
        (token === "konda" &&
        kondaBase > score &&
          adaBase > 1)
      )
    ) {
      res.send(JSON.stringify(401));
      return;
    }

    let result = [];
    for (let i = 0; i < 5; i++) {
      let a = new Array(TOTAL).fill(0);
      for (let j = 0; j < 3; j++) {
        let rand, num;
        do {
          rand = Math.random();
          num = Math.floor(1000 * rand) % TOTAL;
        } while (a[num] == 1);
        result.push(num);
        a[num] = 1;
      }
    }
    console.log("Result: ", result);

    let maxCount = 0;
    // Reward Logic
    for (let i = 0; i < 15; i++) {
      let count = 0;
      if (result[i] === 0) {
        do {
          console.log("ID:   ", i);
          i += 3;
          count++;
        } while (result[i] == 0);
      }

      if (maxCount < count) maxCount = count;
    }
    console.log(maxCount);

    let getAmount = 0;
    let multiplier = 0;
    if (maxCount === 2) {
      getAmount = (score * 12) / 10;
      multiplier = 1.2;
    } else if (maxCount >= 3) {
      getAmount = (score * 15) / 10;
      multiplier = 1.5;
    }

    console.log("Get Amount:  ", getAmount);

    if (token === "nebula") {
      nebulaBase -= score;
      adaBase -= 1;
      nebulaBase += getAmount;
      // nebulaBase -= getAmount;
      // adaBase += 1;
    }

    if (token === "dum") {
      adaBase -= 1;
      dumBase -= score;
      dumBase += getAmount;
      // dumBase -= getAmount;
      // adaBase += 0.5;
    }

    if (token === "konda") {
      adaBase -= 1;
      kondaBase -= score;
      kondaBase += getAmount;
      // kondaBase -= getAmount;
      // adaBase += 0.5;
    }
    if (token === "ada") {
      adaBase -= 2;
      adaBase -= score;
      adaBase += getAmount;
      // adaBase -= getAmount;
      // adaBase += 0.5;
    }


    const dataResult = {
      nebula_balance: nebulaBase,
      dum_balance: dumBase,
      konda_balance: kondaBase,
      ada_balance: adaBase,
    };

    console.log("Result: ", result);
    console.log("remaining balance", adaBase, dumBase, nebulaBase, kondaBase)

    updateUserData(address, dataResult);

    const totalResult = {
      bet: {
        betAmount: score,
        multiplier: multiplier,
        getAmount: getAmount,
      },
      result: result,
      userData: {
        ada: adaBase,
        nebula: nebulaBase,
        dum: dumBase,
        konda: kondaBase,
      },
    };

    res.send(JSON.stringify(totalResult ? totalResult : -200));

    return;
  } catch (error) {
    console.log(error, ">>>> Error in Playing Game");
  }
});

app.post("/getAmount", async (req, res) => {
  try {
    const wallet = req.body.wallet;
    console.log("wallet addre", wallet)
    const data = await loadUserData(wallet);
    // const address = data.address;
    // const index = database.findIndex((obj) => obj.wallet === wallet);
    
    return res.send(data);
  } catch  (error) {
    console.log(error, ">>>> Error in Playing Game");
  }

  // if (address !== wallet) {
  //   // res.send(JSON.stringify(-100));
  //   return data;
  // } else {
  //   const result = data;
  //   return result;
  // }
});

app.post("/depositFund", async (req, res) => {
  const wallet = req.body.wallet;
  const nScore = req.body.nebula;
  const dScore = req.body.dum;
  const sScore = req.body.konda;
  const aScore = req.body.ada;

  const data =  await loadUserData(wallet);
 
  let database = data.db;
  const index = database.findIndex((obj) => obj.wallet === wallet);

  const txDatas = await checkTransaction()
  if (index === -1) {
    const newData = {
      wallet: wallet,
      nebula: parseFloat(nScore),
      dum: parseFloat(dScore),
      konda: parseFloat(sScore),
      ada: parseFloat(aScore),
    };
    database.push(newData);
    const dataResult = {
      db: database,
      nebula: data.nebula,
      dum: data.dum,
      konda: data.konda,
      ada: data.ada,
    };
    saveData(dataResult);
    res.send(JSON.stringify(200));
  } else {
    database[index] = {
      wallet: wallet,
      nebula: database[index].nebula + parseFloat(nScore),
      dum: database[index].dum + parseFloat(dScore),
      konda: database[index].konda + parseFloat(sScore),
      ada: database[index].ada + parseFloat(aScore),
    };
    const dataResult = {
      db: database,
      nebula: data.nebula,
      dum: data.dum,
      konda: data.konda,
      ada: data.ada,
    };
    saveData(dataResult);

    res.send(JSON.stringify(200));
  }
});

app.post("/withdrawFund", async (req, res) => {
  const wallet = req.body.wallet;
  // const nScore = req.body.nebula;
  // const dScore = req.body.dum;
  // const sScore = req.body.konda;
  // const aScore = req.body.ada;

  const nebula = req.body.nebula;
  const dum = req.body.dum;
  const konda = req.body.konda;
  const ada = req.body.ada;

  console.log("wallet address>>>", wallet)
  const data = await loadUserData(wallet);  
  const address = data.address
  console.log("Data:", data);

  const ada_withdraw = parseInt(data.ada_balance) - parseInt(ada)
  const dum_withdraw = parseInt(data.dum_balance) - parseInt(dum)
  const nebula_withdraw = parseInt(data.nebula_balance) - parseInt(nebula)
  const konda_withdraw = parseInt(data.konda_balance) - parseInt(konda)

  const dataResult = {
    nebula_balance: nebula_withdraw,
    dum_balance: dum_withdraw,
    konda_balance: konda_withdraw,
    ada_balance: ada_withdraw,
  };
  // const index = database.findIndex((obj) => obj.wallet === wallet);
  
  if (address !== wallet) {
    res.send(JSON.stringify(-100));
  } else {


    if (data.nebula_balance < parseFloat(nebula)) {
      console.log("Nebula Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }

    if (data.dum_balance < parseFloat(dum)) {
      console.log("Dum Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }

    if (data.konda_balance < parseFloat(konda)) {
      console.log("Konda Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }

    if (parseInt(data.ada_balance) <= parseFloat(ada)) {
      console.log("ADA Amount Exceed");
      res.send(JSON.stringify(-100));
     
      return;
    } else {
      console.log("nice!")
      const txHash = await Withdraw(ada, address)
      const status = "Checking"
      const addPendingData = await savePendingData(config.OWNER_WALLET, address, ada, dum, nebula, konda, txHash, status, "withdraw" );
      await new Promise(async (resolve, reject) => { 
        const itvl = setInterval(async () => {
          try {
            const pendingData = await getPendingData(txHash)
            // console.log("Check", pendingData)
            if (pendingData == null) {
              res.send(JSON.stringify(200));
              clearInterval(itvl);
              resolve(1);
            }
          } catch (e) {
            console.error(e);
            res.status(500).send("DB operation failed");
            clearInterval(itvl);
            reject(e);
          }
        }, 10000);
      });
    }


    // await mint();
    // await sendAdaFromProject("addr_test1vzpwq95z3xyum8vqndgdd9mdnmafh3djcxnc6jemlgdmswcve6tkw", 1);
    // const preResult = await withdrawFromProject(
    //   wallet,
    //   aScore,
    //   nScore,
    //   dScore,
    //   sScore
    // );

    // if (preResult != undefined) {
    //   database[index] = {
    //     wallet: wallet,
    //     nebula: database[index].nebula - parseFloat(nScore),
    //     dum: database[index].dum - parseFloat(dScore),
    //     konda: database[index].konda - parseFloat(sScore),
    //     ada: database[index].ada - parseFloat(aScore),
    //   };

    //   const dataResult = {
    //     db: database,
    //     nebula: data.nebula,
    //     dum: data.dum,
    //     konda: data.konda,
    //     ada: data.ada,
    //   };
    //   saveData(dataResult);
    // }

    // res.send(JSON.stringify(200));
  }
});

// make server listen on some port
((port = process.env.APP_PORT || 5000) => {
  server.listen(port, () => {
    console.log(`>> Listening on port ${port}`);
    return;
  });
})();
