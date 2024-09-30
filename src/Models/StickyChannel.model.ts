import mongoose from "mongoose";
import {
    StickyChannelDocument,
    StickyChannelModel,
} from "./Types/StickyChannelMongooseType";

const stickyChannelSchema = new mongoose.Schema({
    channelId: {
        type: String,
        required: true,
        unique: true,
    },
    recentPostMessageId: {
        type: String,
        required: false, // Change to false to make it optional
        default: null, // Set a default value
    },
    stickyMessageId: {
        type: String,
        required: false, // Change to false to make it optional
        default: null, // Set a default value
    },
});

export default mongoose.model<StickyChannelDocument, StickyChannelModel>(
    "StickyChannel",
    stickyChannelSchema
);
