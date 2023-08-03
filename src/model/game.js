import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
    {
        address: String,
        bet_amount: Array({
            token: String,
            amount: Number,
        }),
        times:Number
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

export const gameModel = mongoose.model("game", gameSchema)