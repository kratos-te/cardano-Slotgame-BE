import database from "mongoose"    
import { usersModel } from "./model/users.js"
import { gameModel } from "./model/game.js"
import { transactionModel } from "./model/transaction.js"
import dotenv from "dotenv";
import { pendingModel } from "./model/peding.js";

dotenv.config({
    path: ".env",
  });
const DB_CONNECTION = process.env.DB_CONNECTION

export const init = () => {
    if (DB_CONNECTION === undefined) return;
    if (database.connection.readyState === database.ConnectionStates.connected)
      return;
    database
      .connect(DB_CONNECTION)
      .then((v) => {
        console.log(`mongodb database connected`);
      })
      .catch((e) => {
        console.error(`mongodb error ${e}`);
      });
};
  
export const addUser = async (address, ada_balance, dum_balance, nebula_balance, konda_balance) => {
    try {
        let ts = new Date()
        
        const newUser = new usersModel({
            address: address,
            ada_balance: ada_balance,
            dum_balance: dum_balance,
            nebula_balance: nebula_balance,
            konda_balance: konda_balance,
        })

        newUser.save(function (err, book) {
            if (err) return console.error(err);
            console.log(newUser, "Saved Successful")
        })
    } catch (error) {
        console.log("error");
    }
};

export const addGame = async (address, token, amount) => {
    try {
        const newGame = new gameModel({
            address: address,
            bet_amount: [{ token: token, amount: amount }],
            times: times,
        });
        newGame.save(function (err) {
            if (err) return console.error(err);
            console.log(newGame, "Saved Successful")
        });
    } catch (error) {
        console.log("error");
    }
};

export const addTransaction = async (address, hash, time, status) => {
    try {
        const newTx = new transactionModel({
            address: address,
            hash: hash,
            time: time,
            status: status,
        });

        newTx.save(function (err) {
            if (err) return console.log(err);
            console.log(newTx, "Saved Successful")
        });
    } catch (err) {
        console.log("error");
    }
};

export const loadUserData = async (address) => {
    if(!address) return null
    try {
       
        const res = await usersModel.findOne({ address })

        return res
    }catch (error) {
        console.log("error");
    }
}


export const updateUserData = async (address, dataResult) => {
    if (!address) return null
    try {
        const filter = { address: address }
        
        const res = await usersModel.findOneAndUpdate(filter, dataResult,  { new: true })
    } catch (error) {
        console.log("update error");
    }
}

export const savePendingData = async (from_address, to_address, ada_balance, dum_balance, nebula_balance, konda_balance, hash, status) => {
    if (!from_address && !to_address) return null
    try {
        const newPendingData = new pendingModel({
            from_address: from_address,
            to_address: to_address,
            ada_balance: ada_balance,
            dum_balance: dum_balance,
            nebula_balance: nebula_balance,
            konda_balance: konda_balance,
            hash: hash,
            status: status
        })
        newPendingData.save(function (err) {
            if (err) return console.log(err);
            console.log(newPendingData, "Saved Successful")
        });
    } catch (err) {
        console.log("error");
    }
}

export const getPendingData = async (hash) => {
    if (!hash) return null
    try {
        const res = await pendingModel.findOne({ hash: hash })
        return res
    } catch (err) {
        console.log("error");
    }
}

export const updatePendingData = async (hash, status) => {
    if (!hash) return null
    try {
        const filter = { hash: hash }
        const update = { status: status }
        const res = await pendingModel.findOneAndUpdate(filter, update, { new: true })
    } catch (err) {
        console.log("update error");
    }
}

export const deletePendingData = async (hash) => {
    if (!hash) return null
    try {
        const res = await pendingModel.findOneAndDelete({ hash: hash })
    } catch (err) {
        console.log("delete error");
    }
}