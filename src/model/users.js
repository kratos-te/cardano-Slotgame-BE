import mongoose from "mongoose";

const usersSchema = new mongoose.Schema(
    {
        address: String,
        ada_balance: Number,
        dum_balance: Number,
        nebula_balance: Number,
        konda_balance: Number,                    
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
)

export const usersModel = mongoose.model("users", usersSchema)