import express from "express";
import axios from "axios";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";

import {Withdraw, sendFee} from "./utils.js";
import {
    init,
    addUser,
    loadUserData,
    updateUserData,
    savePendingData,
    getPendingData,
    updatePendingData,
    deletePendingData,
    isUserExist,
    addGamePlay,
    updateGame,
    getRankingData,
    saveGameFee,
    getGameFee,
    updateGameFee,
} from "./db.js";
import {config} from "./config.js";

let probability = [
    Math.pow(0.34 / 9, 1 / 3),
    Math.pow(0.34 / 9, 1 / 3) + Math.pow(0.1 / 9, 1 / 3),
    Math.pow(0.34 / 9, 1 / 3) + Math.pow(0.1 / 9, 1 / 3) + Math.pow(0.02 / 9, 1 / 3),
    Math.pow(0.34 / 9, 1 / 3) + Math.pow(0.1 / 9, 1 / 3) + Math.pow(0.02 / 9, 1 / 3) + Math.pow(0.002 / 9, 1 / 3),
    Math.pow(0.34 / 9, 1 / 3) +
        Math.pow(0.1 / 9, 1 / 3) +
        Math.pow(0.02 / 9, 1 / 3) +
        Math.pow(0.002 / 9, 1 / 3) +
        Math.pow(0.0002 / 9, 1 / 3),
    Math.pow(0.34 / 9, 1 / 3) +
        Math.pow(0.1 / 9, 1 / 3) +
        Math.pow(0.02 / 9, 1 / 3) +
        Math.pow(0.002 / 9, 1 / 3) +
        Math.pow(0.0002 / 9, 1 / 3) +
        Math.pow(0.0001 / 9, 1 / 3),
];

// load the environment variables from the .env file
dotenv.config({
    path: ".env",
});

const app = express();
const server = http.createServer(app);
server.timeout = 600000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const TOTAL = 7;
init();
cron.schedule("*/10 * * * * *", async function () {
    const instance = await axios.create({
        baseURL: config.BLOCKFROST_API_URL,
        headers: {
            "Content-Type": "application/json",
            project_id: config.BLOCKFROST_API_KEY,
        },
    });
    const transactions = await instance
    .get("/addresses/addr1v8kmayk5e3pp8dxgj63j82v3egp7wneye7d3lfvtah0uaxcld8p2q/transactions?order=desc")
    .then((response) => response.data)
    .catch((error) => {
        console.log(error);
        return [];
    });
    // console.log("txdata", transactions)
    const processTransaction = async (transaction) => {
        const hash = transaction.tx_hash.toString();
        const pendingData = await getPendingData(hash);

        if (pendingData) {
            if (pendingData.action === "deposit") {
                const hashTable = pendingData.hash;
                const hashData = await instance.get(`/txs/${hashTable}`);
                console.log("hashDat", hashData.data);
                if (hashData.data.valid_contract) {
                    const status = "confirmed";
                    const updatePending = await updatePendingData(hashTable, status);
                }
                if (pendingData.status === "confirmed") {
                    const data = await loadUserData(pendingData.from_address);
                    const ada_deposited = parseFloat(pendingData.ada_balance) + parseFloat(data?.ada_balance || 0);
                    const dum_deposited = parseFloat(pendingData.dum_balance) + parseFloat(data?.dum_balance || 0);
                    const nebula_deposited =
                        parseFloat(pendingData.nebula_balance) + parseFloat(data?.nebula_balance || 0);
                    const konda_deposited =
                        parseFloat(pendingData.konda_balance) + parseFloat(data?.konda_balance || 0);
                    const snek_deposited = parseFloat(pendingData.snek_balance) + parseFloat(data?.snek_balance || 0);
                    let userAdded = false;

                    const deletePending = await deletePendingData(pendingData.hash);

                    if (!data) {
                        const isUserAdded = await isUserExist(pendingData.from_address);
                        if (!isUserAdded) {
                            // add user and set flag to true
                            const userData = await addUser(
                                pendingData.from_address,
                                ada_deposited,
                                dum_deposited,
                                nebula_deposited,
                                konda_deposited,
                                snek_deposited
                            );
                            const addGameData = await addGamePlay();
                            userAdded = true;
                        } else {
                            userAdded = false;
                        }
                    } else {
                        const dataResult = {
                            nebula_balance: nebula_deposited,
                            dum_balance: dum_deposited,
                            konda_balance: konda_deposited,
                            ada_balance: ada_deposited,
                            snek_balance: snek_deposited,
                        };
                        const updateUser = await updateUserData(pendingData.from_address, dataResult);
                    }
                }
            }

            if (pendingData.action === "withdraw") {
                const hashTable = pendingData.hash;
                const hashData = await instance.get(`/txs/${hashTable}`);
                if (hashData.data.valid_contract) {
                    const status = "confirmed";
                    const updatePending = await updatePendingData(hashTable, status);
                }
                if (pendingData.status === "confirmed") {
                    try {
                        const data = await loadUserData(pendingData.to_address);
                        const ada_withdraw = parseFloat(data.ada_balance) - parseFloat(pendingData.ada_balance);
                        const dum_withdraw = parseFloat(data.dum_balance) - parseFloat(pendingData.dum_balance);
                        const nebula_withdraw =
                            parseFloat(data.nebula_balance) - parseFloat(pendingData.nebula_balance);
                        const konda_withdraw = parseFloat(data.konda_balance) - parseFloat(pendingData.konda_balance);
                        const snek_withdraw = parseFloat(data.snek_balance) - parseFloat(pendingData.snek_balance);
                        const dataResult = {
                            nebula_balance: nebula_withdraw,
                            dum_balance: dum_withdraw,
                            konda_balance: konda_withdraw,
                            ada_balance: ada_withdraw,
                            snek_balance: snek_withdraw,
                        };
                        const deletePending = await deletePendingData(pendingData.hash);
                        if (data.ada_balance < pendingData.ada_balance) {
                            console.log("ADA Amount Exceed");
                            res.send(JSON.stringify(-100));
                        } else {
                            console.log("Good", data.ada_balance > pendingData.ada_balance);
                            const updateData = await updateUserData(pendingData.to_address, dataResult);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        }
    };
    Promise.all(transactions.map(processTransaction));
});

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
    const snek_balance = req.body.snek_balance;
    const txhash = req.body.txHash;

    if (to_address !== config.OWNER_WALLET) {
        res.status(400).send("Invalid target address");
        return;
    }
    const fee = await getGameFee();
    console.log("fee", fee);
    if (fee) {
        const sendGameFee = await sendFee(
            fee.ada_count,
            fee.nebula_count,
            fee.dum_count,
            fee.konda_count,
            fee.snek_count
        );
        const initGameFee = await updateGameFee(0, 0, 0, 0);
    }

    const status = "Checking";
    const addPendingData = await savePendingData(
        from_address,
        to_address,
        ada_balance,
        dum_balance,
        nebula_balance,
        konda_balance,
        snek_balance,
        txhash,
        status,
        "deposit"
    );

    // Await until pending Tx will remove in DB
    await new Promise(async (resolve, reject) => {
        const itvl = setInterval(async () => {
            try {
                const pendingData = await getPendingData(txhash);
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

let ada_count = 0;
let dum_count = 0;
let nebula_count = 0;
let konda_count = 0;
let snek_count = 0;
let getAda = 0;
let getDum = 0;
let getNebula = 0;
let getKonda = 0;
let getSnek = 0;
app.post("/play", async (req, res) => {
    try {
        const wallet = req.body.wallet;
        const token = req.body.token;
        const scores = req.body.score;

        const score = parseFloat(scores);
        const setedToken = token;

        //    count++;
        //    console.log("==== count ====", token, count, setedToken);
        const data = await loadUserData(wallet);

        let address = data.address;
        let nebulaBase = data.nebula_balance;
        let dumBase = data.dum_balance;
        let kondaBase = data.konda_balance;
        let adaBase = data.ada_balance;
        let snekBase = data.snek_balance;

        if (address !== wallet) {
            res.send(JSON.stringify(501));
            return;
        } else if (
            !(
                (token === "ada" && adaBase > score && adaBase > 1) ||
                (token === "nebula" && nebulaBase > score && adaBase > 1) ||
                (token === "dum" && dumBase > score && adaBase > 1) ||
                (token === "konda" && kondaBase > score && adaBase > 1) ||
                (token === "snek" && snekBase > score && snekBase > 1)
            )
        ) {
            res.send(JSON.stringify(401));
            return;
        }

        let bang = [false, false, false, false, false, false];
        let focus = 6;
        let freq = 0;

        let result = [];
        for (let i = 0; i < 15; i++) {
            let rand = Math.random();
            let number = Math.floor(Math.random() * 18) + 6;
            for (let j = 0; j < probability.length; j++) {
                if (rand < probability[j]) {
                    number = j;
                    break;
                }
            }
            if (number != focus || i % 5 == 0) {
                focus = number;
                freq = 1;
            } else {
                freq++;
            }
            if (focus < 6 && freq == 3) {
                console.log(focus);
                bang[focus] = true;
                freq = 0;
            }
            result.push(number);
        }
        console.log("Result: ", result);
        console.log("bang:", bang);

        let getAmount = 0;
        let multiplier = 0;

        for (let i = 0; i < bang.length; i++) {
            if (bang[i] == true) {
                if (i == 0) {
                    getAmount = (score * 15) / 10;
                    multiplier = 1.5;
                }
                if (i == 1) {
                    getAmount = (score * 20) / 10;
                    multiplier = 2.0;
                }
                if (i == 2) {
                    getAmount = (score * 30) / 10;
                    multiplier = 3.0;
                }
                if (i == 3) {
                    getAmount = (score * 36) / 10;
                    multiplier = 3.6;
                }
                if (i == 4) {
                    getAmount = (score * 50) / 10;
                    multiplier = 5.0;
                }
                if (i == 5) {
                    getAmount = (score * 100) / 10;
                    multiplier = 10.0;
                }
            }
        }

        // Reward Logic
        console.log("Get Amount:  ", getAmount);

        if (token === "nebula") {
            nebulaBase -= score;
            adaBase -= 1;
            nebulaBase += getAmount;
            nebula_count++;
            getNebula += getAmount;
            // nebulaBase -= getAmount;
            // adaBase += 1;
        }

        if (token === "dum") {
            adaBase -= 2;
            dumBase -= score;
            dumBase += getAmount;
            dum_count++;
            getDum += getAmount;
            // dumBase -= getAmount;
            // adaBase += 0.5;
        }

        if (token === "konda") {
            adaBase -= 2;
            kondaBase -= score;
            kondaBase += getAmount;
            konda_count++;
            getKonda += getAmount;
            // kondaBase -= getAmount;
            // adaBase += 0.5;
        }
        if (token === "ada") {
            // adaBase -= 1;
            adaBase -= score;
            adaBase += getAmount;
            
            getAda += getAmount;
            if (multiplier > 0) {
                ada_count++;
            }
            // adaBase -= getAmount;
            // adaBase += 0.5;
        }
        if (token === "snek") {
            // adaBase -= 2;
            snekBase -= score + 1000;
            snekBase += getAmount;
            getSnek += getAmount;
            snek_count++;
        }

        const dataResult = {
            nebula_balance: nebulaBase,
            dum_balance: dumBase,
            konda_balance: kondaBase,
            ada_balance: adaBase,
            snek_balance: snekBase,
        };
        const updateData = {
            nebula_balance: getNebula,
            dum_balance: getDum,
            konda_balance: getKonda,
            ada_balance: getAda,
            snek_balance: getSnek,
        };

        console.log("remaining balance", adaBase, dumBase, nebulaBase, kondaBase, snekBase);

        if (multiplier !== 0) {
            setTimeout(() => {
                updateUserData(address, dataResult);
            }, 10000);
        } else {
            updateUserData(address, dataResult);
        }
        const updateGameData = updateGame(address, updateData);

        //arrage result
        let arranged_result = [];
        for (let i = 0; i < 5; i++) {
            arranged_result.push(result[i]);
            arranged_result.push(result[5 + i]);
            arranged_result.push(result[10 + i]);
        }

        console.log("arranged_result: ", arranged_result);

        const totalResult = {
            bet: {
                betAmount: score,
                multiplier: multiplier,
                getAmount: getAmount,
            },
            result: arranged_result,
            userData: {
                ada: adaBase,
                nebula: nebulaBase,
                dum: dumBase,
                konda: kondaBase,
                snek: snekBase,
            },
        };

        res.send(JSON.stringify(totalResult ? totalResult : -200));
        const getGameFeeData = await getGameFee();
        if (!getGameFeeData) {
            const addGameFee = await saveGameFee(ada_count, nebula_count, dum_count, konda_count, snek_count);
        } else {
            const updateGameFeeData = await updateGameFee(ada_count, nebula_count, dum_count, konda_count, snek_count);
        }

        return;
    } catch (error) {
        console.log(error, ">>>> Error in Playing Game");
    }
});

app.post("/getAmount", async (req, res) => {
    try {
        const wallet = req.body.wallet;
        console.log("wallet addre", wallet);
        const data = await loadUserData(wallet);

        return res.send(data);
    } catch (error) {
        console.log(error, ">>>> Error in Get Amount");
    }
});

app.post("/getRanking", async (req, res) => {
    try {
        const data = await getRankingData();
        return res.send(data);
    } catch (error) {
        console.log(error, ">>>> Error in Get Ranking");
    }
});

app.post("/withdrawFund", async (req, res) => {
    const wallet = req.body.wallet;
    const nebula = req.body.nebula;
    const dum = req.body.dum;
    const konda = req.body.konda;
    const ada = req.body.ada;
    const snek = req.body.snek;

    console.log("wallet address>>>", wallet);
    const data = await loadUserData(wallet);
    const address = data.address;
    console.log("Data:", data);

    const ada_withdraw = parseInt(data.ada_balance) - parseInt(ada);
    const dum_withdraw = parseInt(data.dum_balance) - parseInt(dum);
    const nebula_withdraw = parseInt(data.nebula_balance) - parseInt(nebula);
    const konda_withdraw = parseInt(data.konda_balance) - parseInt(konda);
    const snek_withdraw = parseInt(data.snek_balance) - parseInt(snek);

    const dataResult = {
        nebula_balance: nebula_withdraw,
        dum_balance: dum_withdraw,
        konda_balance: konda_withdraw,
        ada_balance: ada_withdraw,
        snek_balance: snek_withdraw,
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

        if (data.snek_balance < parseFloat(snek)) {
            console.log("Snek Amount Exceed");
            res.send(JSON.stringify(-100));
            return;
        }
        if (parseInt(data.ada_balance) < parseFloat(ada)) {
            console.log("ADA Amount Exceed");
            res.send(JSON.stringify(-100));

            return;
        } else {
            console.log("nice!", ada, dum, nebula, konda, snek);
            const txHash = await Withdraw(ada, dum, nebula, konda, snek, address);
            const status = "Checking";
            const addPendingData = await savePendingData(
                config.OWNER_WALLET,
                address,
                ada,
                dum,
                nebula,
                konda,
                snek,
                txHash,
                status,
                "withdraw"
            );
            await new Promise(async (resolve, reject) => {
                const itvl = setInterval(async () => {
                    try {
                        const pendingData = await getPendingData(txHash);
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
    }
});

// make server listen on some port
((port = process.env.APP_PORT || 5000) => {
    server.listen(port, () => {
        console.log(`>> Listening on port ${port}`);
        return;
    });
})();
