import { Document, Model } from "mongoose";

export interface GiveawayType {
    channelId: string;
    messageId: string;
    winnerCount: number;
    deadline: Date;
    createdAt?: Date;
}

export interface GiveawayDocument extends GiveawayType, Document {}
export interface GiveawayModel extends Model<GiveawayDocument> {}
