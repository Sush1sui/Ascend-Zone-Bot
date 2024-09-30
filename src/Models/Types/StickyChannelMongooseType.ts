import { Document, Model } from "mongoose";

export interface StickyChannelType {
    channelId: string;
    recentPostMessageId: string | null;
    stickyMessageId: string | null;
}

export interface StickyChannelDocument extends StickyChannelType, Document {}
export interface StickyChannelModel extends Model<StickyChannelDocument> {}
