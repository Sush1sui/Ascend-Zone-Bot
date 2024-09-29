import { Document, Model } from "mongoose";

export interface VerificationMessageType {
    verificationMessagePresent: boolean;
    verificationMessageID: string | null;
    verificationChannelID: string | null;
}

export interface VerificationDocument
    extends VerificationMessageType,
        Document {}
export interface VerificationModel extends Model<VerificationDocument> {}
