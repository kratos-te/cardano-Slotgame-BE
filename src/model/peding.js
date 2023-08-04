import mongoose from "mongoose";

const pendingSchema = new mongoose.Schema(
    {
        from_address: String,
        to_address: String,
        ada_balance: Number,
        dum_balance: Number,
        nebula_balance: Number,
        konda_balance: Number,
        hash: String,
        status: String,
        action: String,
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

export const pendingModel = mongoose.model("pending", pendingSchema);