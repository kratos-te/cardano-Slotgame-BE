import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
    {
        address: String,
        ada_balance: Number,
        dum_balance: Number,
        nebula_balance: Number,
        konda_balance: Number,  
        snek_balance: Number
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

export const gameModel = mongoose.model("game", gameSchema)