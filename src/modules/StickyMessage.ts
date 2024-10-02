import StickyChannel from "../Models/StickyChannel.model";

export async function initializeStickyMessages() {
    try {
        // Check if there are any existing sticky channels in the database
        const existingChannels = await StickyChannel.find();

        const STICKY_CHANNELS = await getAllStickyMessageChannelID();

        // If no channels exist, insert the predefined CHANNELS
        if (existingChannels.length === 0) {
            const stickyChannelEntries = STICKY_CHANNELS.map((channelId) => ({
                channelId: channelId,
                recentPostMessageId: null,
                stickyMessageId: null,
            }));

            await StickyChannel.insertMany(stickyChannelEntries);
            console.log("Initialized sticky channels:", stickyChannelEntries);
        } else {
            console.log("Sticky channels already initialized");
        }
    } catch (error) {
        console.error("Error initializing sticky messages:", error);
    }
}

export async function addStickyMessage(channelId: string) {
    try {
        const existingChannel = await StickyChannel.find({ channelId });
        if (existingChannel.length > 0)
            throw new Error(
                `Channel: ${channelId} is already set to have sticky message`
            );

        const stickyChannel = await StickyChannel.create({
            channelId,
            recentPostMessageId: null,
            stickyMessageId: null,
        });
        console.log(
            `Sticky Message for channel: ${stickyChannel.channelId} has been set`
        );
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function deleteStickyMessage(channelId: string) {
    try {
        const deletedStickyChannel = await StickyChannel.findOneAndDelete({
            channelId,
        });
        if (!deleteStickyMessage) {
            return "sticky not found";
        }
        console.log(
            `Sticky Message has been unset for channel ${deletedStickyChannel?.channelId}`
        );
        return "success";
    } catch (error) {
        console.log(error);
        return "error";
    }
}

export async function getAllStickyMessageChannelID() {
    try {
        const stickyChannels = await StickyChannel.find();
        const arr: string[] = [];

        for (const s of stickyChannels) {
            arr.push(s.channelId);
        }
        return arr;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export async function getStickyMessage_MID(
    channelId: string
): Promise<string | null> {
    try {
        const stickyMessage = await StickyChannel.findOne({ channelId });

        if (stickyMessage && stickyMessage.stickyMessageId) {
            return stickyMessage.stickyMessageId; // Return the stickyMessageId if it exists
        }

        console.log(`No sticky message ID found for channel ID: ${channelId}`);
        return null; // Return null if no stickyMessageId exists
    } catch (error) {
        console.error("Error retrieving sticky message ID:", error);
        throw new Error("Failed to retrieve sticky message ID");
    }
}

export async function getStickyMessage_RPID(
    channelId: string
): Promise<string | null> {
    try {
        const stickyMessage = await StickyChannel.findOne({ channelId });

        if (stickyMessage && stickyMessage.recentPostMessageId) {
            return stickyMessage.recentPostMessageId; // Return the recentMessageID if it exists
        }

        console.log(`No recent message ID found for channel ID: ${channelId}`);
        return null; // Return null if no recentMessageID exists
    } catch (error) {
        console.error("Error retrieving recent message ID:", error);
        throw new Error("Failed to retrieve recent message ID");
    }
}

export async function setStickyMessage_MID(
    channelId: string,
    recentMessage: string | null,
    stickyMessage: string | null
) {
    try {
        const updatedStickyMessage = await StickyChannel.findOneAndUpdate(
            { channelId }, // Find the document with the specified channelId
            {
                recentPostMessageId: recentMessage, // Update the recentPostMessageId to the new value
                stickyMessageId: stickyMessage, // Update the stickyMessageId to the new value
            },
            { new: true } // Return the updated document
        );

        if (updatedStickyMessage) {
            console.log(
                `Updated sticky and recent message IDs for channel ${channelId}: recentMessage: ${recentMessage}, stickyMessage: ${stickyMessage}`
            );
            return updatedStickyMessage; // Return the updated document
        } else {
            console.log(`No sticky channel found for channel ID: ${channelId}`);
            return null; // Handle the case when no document is found
        }
    } catch (error) {
        console.error("Error updating sticky and recent message IDs:", error);
        throw error; // Rethrow the error for further handling if needed
    }
}

export async function getAllStickyMessage() {
    try {
        return await StickyChannel.find();
    } catch (error) {
        console.log(error);
        return [];
    }
}
