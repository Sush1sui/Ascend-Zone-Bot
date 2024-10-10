import mongoose from "mongoose";
import { GiveawayDocument, GiveawayModel } from "./Types/GiveawayMongooseType";

const giveawaySchema = new mongoose.Schema({
    channelId: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
        unique: true,
    },
    winnerCount: {
        type: Number,
        required: true,
    },
    prize: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

export default mongoose.model<GiveawayDocument, GiveawayModel>(
    "Giveaway",
    giveawaySchema
);
