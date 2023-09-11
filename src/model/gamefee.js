import mongoose from "mongoose";

const gamefeeSchema = new mongoose.Schema(
    {
        ada_count: Number,
        dum_count: Number,
        nebula_count: Number,
        konda_count: Number,
        snek_count: Number,  
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

export const gamefeeModel = mongoose.model("gamefee", gamefeeSchema)