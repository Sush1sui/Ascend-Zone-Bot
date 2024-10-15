import mongoose from "mongoose";
import {
    ReactRoleDocument,
    ReactRoleModel,
} from "./Types/ReactRolesMongooseType";

const reactRolesSchema = new mongoose.Schema({
    channelId: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
        unique: true,
    },
    reactRoles: [
        {
            emoji: {
                type: String,
                required: true,
            },
            roleId: {
                type: String,
                required: true,
            },
        },
    ],
});

export default mongoose.model<ReactRoleDocument, ReactRoleModel>(
    "ReactRole",
    reactRolesSchema
);
