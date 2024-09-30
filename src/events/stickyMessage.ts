import { GuildMember, Message, TextChannel } from "discord.js";
import {
    getStickyMessage_MID,
    setStickyMessage_MID,
} from "../modules/StickyMessage";

export const STICKY_CHANNELS = [
    "1140719367366123541",
    "967416435410337847",
    "1157929158026993745",
    "1274400505744855142",
    "1149557123999604867",
    "1140718990495326339",
];

export default {
    name: "messageCreate",
    once: false,
    async execute(message: Message): Promise<void> {
        try {
            if (message.author.bot) return;

            if (!(message.member as GuildMember)) return;

            // Check if the message was sent in a sticky channel
            if (STICKY_CHANNELS.includes(message.channel.id)) {
                // Check if the channel is a TextChannel
                if (message.channel instanceof TextChannel) {
                    // Get the existing sticky message ID from the database
                    const existingStickyMessageId = await getStickyMessage_MID(
                        message.channel.id
                    );

                    // If there is an existing sticky message, delete it
                    if (existingStickyMessageId) {
                        const existingMessage =
                            await message.channel.messages.fetch(
                                existingStickyMessageId
                            );
                        if (existingMessage) {
                            await existingMessage.delete();
                            console.log(
                                `Deleted existing sticky message with ID: ${existingStickyMessageId}`
                            );
                        }
                    }

                    // Fetch the last message sent in the channel (if any)
                    const messages = await message.channel.messages.fetch({
                        limit: 2,
                    });
                    const recentMessage = messages.last(); // The most recent message before the sticky message

                    let recentMessageId: string | null = null; // Default to null if no recent message exists
                    if (recentMessage && recentMessage.id !== message.id) {
                        recentMessageId = recentMessage.id; // Store the ID of the recent message if it's not the sticky message itself
                    }

                    // Send the new sticky message and store its ID in the database
                    const newStickyMessage = await message.channel.send(
                        "__**Stickied Message:**__\n\nKindly avoid chatting or flood replies. Just use the **Thread** to avoid spamming or you will be **Timed out**"
                    );

                    // Update both recent and sticky message IDs
                    await setStickyMessage_MID(
                        message.channel.id,
                        recentMessageId, // Set recentPostMessageId
                        newStickyMessage.id // Set stickyMessageId
                    );

                    console.log(
                        `Sent new sticky message: ${newStickyMessage.id}`
                    );
                } else {
                    console.log("The message was not sent in a text channel.");
                }
            }
        } catch (error) {
            console.error(
                `Failed to send message: ${(error as Error).message}`
            );
            return;
        }
    },
};
