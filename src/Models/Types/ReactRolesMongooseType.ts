import { Document, Model } from "mongoose";

export interface ReactRoleType {
    channelId: string;
    messageId: string;
    reactRoles: [
        {
            emoji: string;
            roleId: string;
        }
    ];
}

export interface ReactRoleDocument extends ReactRoleType, Document {}
export interface ReactRoleModel extends Model<ReactRoleDocument> {}
