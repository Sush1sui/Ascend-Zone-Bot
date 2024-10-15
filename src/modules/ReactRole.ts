import ReactRole from "../Models/ReactRoles.model";

export async function fetchAllReactRoles() {
    try {
        return await ReactRole.find();
    } catch (error) {
        console.error("Error fetching React Roles: ", error);
        return null;
    }
}

export async function createReactRole(
    channelId: string,
    messageId: string,
    inputEmoji: string,
    roleId: string
) {
    try {
        const existingReactRole = await ReactRole.findOne({
            channelId,
            messageId,
        });

        if (!existingReactRole) {
            const updatedReactRoleMessage = await ReactRole.create({
                channelId,
                messageId,
                reactRoles: [{ inputEmoji, roleId }],
            });
            console.log(
                `Added reaction role for channel id: ${channelId} and message id: ${messageId}`
            );
            return updatedReactRoleMessage;
        }

        const existsInArray = existingReactRole.reactRoles.some(
            (role) => role.emoji === inputEmoji && role.roleId === roleId
        );

        if (existsInArray) {
            console.log(
                `Reaction role with emoji ${inputEmoji} and role ID ${roleId} already exists for message ${messageId}`
            );
            return existingReactRole;
        }

        const updatedReactRoleMessage = await ReactRole.findOneAndUpdate(
            { channelId, messageId },
            { $push: { reactRoles: { inputEmoji, roleId } } },
            { new: true }
        );
        console.log(
            `Updated reaction role for channel id: ${channelId} and message id: ${messageId}`
        );
        return updatedReactRoleMessage;
    } catch (error) {
        console.error("Error creating react role", error);
        return null;
    }
}

export async function deleteReactRole(
    channelId: string,
    messageId: string,
    roleId: string
) {
    try {
        const reactRole = await ReactRole.findOne({ channelId, messageId });
        if (!reactRole) throw new Error("No message found");

        const existsInArray = reactRole.reactRoles.some(
            (role) => role.roleId === roleId
        );

        if (!existsInArray) {
            throw new Error("Role ID not found in the react roles");
        }

        await ReactRole.findOneAndUpdate(
            { channelId, messageId },
            { $pull: { reactRoles: { roleId } } },
            { new: true }
        );

        console.log(
            `Removed reaction role with role ID: ${roleId} from message ID: ${messageId}`
        );
        return true;
    } catch (error) {
        console.error("Error deleting react role: ", error);
        return false;
    }
}
