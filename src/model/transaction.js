import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        address: String,
        hash: String,
        time: String,
        status: String,
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

export const transactionModel = mongoose.model("transaction", transactionSchema)