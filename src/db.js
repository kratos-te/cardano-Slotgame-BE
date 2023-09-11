import database from "mongoose"
import { usersModel } from "./model/users.js"
import { gameModel } from "./model/game.js"
import { transactionModel } from "./model/transaction.js"
import dotenv from "dotenv";
import { pendingModel } from "./model/peding.js";
import { gamefeeModel } from "./model/gamefee.js";

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

export const addUser = async (address, ada_balance, dum_balance, nebula_balance, konda_balance, snek_balance ) => {
    try {
        let ts = new Date()
        const newUser = new usersModel({
            address: address,
            ada_balance: ada_balance,
            dum_balance: dum_balance,
            nebula_balance: nebula_balance,
            konda_balance: konda_balance,
            snek_balance: snek_balance,
        })

        newUser.save(function (err, book) {
            if (err) return console.error(err);
            console.log(newUser, "Saved new user Successful")
        })
    } catch (error) {
        console.log("error");
    }
};

export const addGamePlay = async (address, ada_balance, dum_balance, nebula_balance, konda_balance, snek_balance) => {
    try {
        let ts = new Date()

        const newGamePlay = new gameModel({
            address: address,
            ada_balance: ada_balance,
            dum_balance: dum_balance,
            nebula_balance: nebula_balance,
            konda_balance: konda_balance,
            snek_balance: snek_balance,
        })

        newGamePlay.save(function (err, book) {
            if (err) return console.error(err);
            console.log(newGamePlay, "Saved Successful")
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

export const addTransaction = async (address, hash, status) => {
    try {
        const newTx = new transactionModel({
            address: address,
            hash: hash,
            status: status
        });

        newTx.save(function (err) {
            if (err) return console.log(err);
            console.log(newTx, "Saved Transaction Successful")
        });
    } catch (err) {
        console.log("error",err);
    }
};

export const getTransaction = async(hash) => {
    try {
        const res = await transactionModel.findOne({ hash: hash })
        return res
    } catch (err) {
            console.log("error", err)
    }
}

export const getTransactionByAddress = async(address) => {
    try {
        const res = await transactionModel.findOne({ address: address })
        return res
    } catch (err) {
            console.log("error", err)
    }
}

export const updateTransaction = async(hash, status) => {
    try {
        const filter = {hash: hash}
        const update = { status: status }
        const res = await transactionModel.findOneAndUpdate(filter, update, { new: true })
        return res
    } catch (err) {
        console.log("error", err)
    }
}

export const deleteTransaction = async(hash) => {
    if (!hash) return null
    try {
        const res = await transactionModel.findOneAndDelete({ hash: hash })
    } catch (err) {
        console.log("delete error");
    }
}

export const loadUserData = async (address) => {
    if (!address) return null
    try {
        const res = await usersModel.findOne({ address })
        return res
    } catch (error) {
        console.log("error");
    }
}

export const isUserExist = async (address) => {
    // replace this with your own database query
    const user = await usersModel.findOne({ address });
    return !!user; // return true if user exists, false otherwise
};

export const loadPlayData = async (address) => {
    if (!address) return null
    try {

        const res = await gameModel.findOne({ address })

        return res
    } catch (error) {
        console.log("error");
    }
}


export const updateUserData = async (address, dataResult) => {
    if (!address) return null
    try {
        const filter = { address: address }
        const res = await usersModel.findOneAndUpdate(filter, dataResult, { new: true })
    } catch (error) {
        console.log("update error");
    }
}

export const updatePlayData = async (address, dataResult) => {
    if (!address) return null
    try {
        const filter = { address: address }

        const res = await gameModel.findOneAndUpdate(filter, dataResult, { new: true })
    } catch (error) {
        console.log("update error");
    }
}

export const savePendingData = async (from_address, to_address, ada_balance, dum_balance, nebula_balance, konda_balance, snek_balance, hash, status, action) => {
    if (!from_address && !to_address) return null
    try {
        const newPendingData = new pendingModel({
            from_address: from_address,
            to_address: to_address,
            ada_balance: ada_balance,
            dum_balance: dum_balance,
            nebula_balance: nebula_balance,
            konda_balance: konda_balance,
            snek_balance: snek_balance,
            hash: hash,
            status: status,
            action: action
        })
        newPendingData.save(function (err) {
            if (err) return console.log(err);
            console.log(newPendingData, "Saved pending data Successful")
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

export const saveGameFee = async (ada_count, nebula_count, dum_count, konda_count, snek_count) => {
    try{
        const newGameFeeData = new gamefeeModel({
            ada_count: ada_count,
            nebula_count: nebula_count,
            dum_count: dum_count,
            konda_count: konda_count,
            snek_count: snek_count
        })

        newGameFeeData.save(function (err) {
            if (err) return console.log(err);
            console.log(newGameFeeData, "Saved game fee data Successful")
        });
    } catch (err) {
        console.log("Error saving game fee Data")
    }
}

export const getGameFee = async() => {
    try {
        const res = await gamefeeModel.findOne();
        return res
    } catch (err) {
        console.log("load error");
    }
}

export const updateGameFee = async(ada_count, nebula_count, dum_count, konda_count, snek_count) => {
    try {
        const res = await gamefeeModel.updateOne({ada_count:ada_count, nebula_count:nebula_count, dum_count:dum_count, konda_count:konda_count, snek_count:snek_count})
    } catch (err) {
        console.log("update error");
    }
}