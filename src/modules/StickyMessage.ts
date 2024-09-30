import StickyChannel from "../Models/StickyChannel.model";
import { STICKY_CHANNELS } from "../events/stickyMessage";

export async function initializeStickyMessages() {
    try {
        // Check if there are any existing sticky channels in the database
        const existingChannels = await StickyChannel.find();

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
            console.log(
                "Sticky channels already initialized:",
                existingChannels
            );
        }
    } catch (error) {
        console.error("Error initializing sticky messages:", error);
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
