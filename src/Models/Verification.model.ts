import mongoose from "mongoose";
import {
    VerificationDocument,
    VerificationModel,
} from "./Types/VerificationMongooseType";

const verificationMessageSchema = new mongoose.Schema({
    verificationMessagePresent: {
        type: Boolean,
        required: true,
        default: false,
    },
    verificationMessageID: {
        type: String,
        required: false,
        default: null,
    },
    verificationChannelID: {
        type: String,
        required: false,
        default: null,
    },
});

export default mongoose.model<VerificationDocument, VerificationModel>(
    "VerificationMessage",
    verificationMessageSchema
);
