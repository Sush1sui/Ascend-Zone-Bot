import { Message } from "discord.js";

const CHANNELS = ["1140719367366123541"];

export default {
    name: "messageCreate", // Correct event for when a message is sent
    once: false,
    async execute(message: Message) {
        try {
            // Check if the message is from a bot or not in the specified channels
            if (message.author.bot || !CHANNELS.includes(message.channel.id)) {
                return;
            }

            // React with custom animated emojis
            await message.react("40741rainbowheart:1287594223222128731");
            await message.react("66082redcrystalheart:1287594201277661224");
        } catch (error) {
            console.error(
                `Failed to add reaction: ${(error as Error).message}`
            );
        }
    },
};
