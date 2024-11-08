import { Message } from "discord.js";

const CHANNELS = ["1140719367366123541"];

export default {
    name: "messageReactionAdd",
    once: false,
    async execute(message: Message) {
        try {
            if (message.author.bot || !CHANNELS.includes(message.channel.id))
                return;
            await message.react("<a:40741rainbowheart:1287594223222128731>");
            await message.react("<a:66082redcrystalheart:1287594201277661224>");
        } catch (error) {
            console.error(
                `Failed to delete message: ${(error as Error).message}`
            );
        }
    },
};
