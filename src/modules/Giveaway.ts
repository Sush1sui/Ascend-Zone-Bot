import { TextChannel, EmbedBuilder, Client } from "discord.js";
import Giveaway from "../Models/Giveaway.model";

export async function initializeGiveawayTimeouts(client: Client) {
    try {
        // Get all active giveaways from the database
        const activeGiveaways = await fetchAllGiveaways();

        if (activeGiveaways === null) return;

        // Iterate through each active giveaway
        for (const giveaway of activeGiveaways) {
            const { channelId, messageId, prize, winnerCount, deadline } =
                giveaway;
            const channel = (await client.channels.fetch(
                channelId
            )) as TextChannel;

            // If the channel does not exist or is not a TextChannel, skip
            if (!channel || !(channel instanceof TextChannel)) continue;

            const endTime = deadline.getTime();
            const timeLeft = endTime - Date.now();
            console.log(`end time: ${deadline}`);
            console.log(`time left: ${timeLeft}`);

            // If the giveaway has already ended, handle it here
            if (timeLeft <= 0) {
                console.log(
                    `Giveaway with message ID ${messageId} has already ended.`
                );
                await handleGiveawayEnd(channel, messageId, prize, winnerCount);
                continue;
            }

            // Set a timeout for the giveaway
            setTimeout(async () => {
                await handleGiveawayEnd(channel, messageId, prize, winnerCount);
            }, timeLeft);
        }
        console.log("On-going giveaways has been initialized");
    } catch (error) {
        console.error("Error initializing giveaway timeouts:", error);
    }
}

export function createUtcDate(
    days: number,
    hours: number,
    minutes: number
): Date {
    const now = new Date();
    // Calculate the total milliseconds to add to the current date
    const totalMilliseconds =
        days * 24 * 60 * 60 * 1000 + // Convert days to milliseconds
        hours * 60 * 60 * 1000 + // Convert hours to milliseconds
        minutes * 60 * 1000; // Convert minutes to milliseconds

    return new Date(now.getTime() + totalMilliseconds); // Create the new date in UTC
}

async function handleGiveawayEnd(
    channel: TextChannel,
    messageId: string,
    prize: string,
    winnerCount: number
) {
    try {
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            console.error(`Message with ID ${messageId} not found.`);
            await deleteGiveaway(channel.id, messageId);
            return;
        }

        // Fetch all reactions to find participants
        const reaction = message.reactions.cache.get("🎉");
        let participants: string[] = [];

        if (reaction) {
            const users = await reaction.users.fetch();
            participants = users
                .filter((user) => !user.bot)
                .map((user) => user.id);
        }

        if (participants.length === 0) {
            const endEmbed = new EmbedBuilder()
                .setTitle("GIVEAWAY ENDED")
                .setDescription(
                    `No participants entered the giveaway for prize: \`${prize}\``
                )
                .setColor("DarkBlue");

            await channel.send({
                content: "<@&967418794807033906>",
                allowedMentions: { parse: ["roles"] },
                embeds: [endEmbed],
            });
        } else {
            const winners = selectRandomWinners(participants, winnerCount);
            const winnersString = winners
                .map((winnerId) => `<@${winnerId}>`)
                .join(", ");

            const endEmbed = new EmbedBuilder()
                .setTitle("GIVEAWAY ENDED")
                .setDescription(
                    `Prize: \`${prize}\`\n\nWinners: ${winnersString}`
                )
                .setColor("Green");

            await channel.send({
                content: "<@&967418794807033906>",
                allowedMentions: { parse: ["roles"] },
                embeds: [endEmbed],
            });
        }

        await deleteGiveaway(channel.id, messageId);
        console.log(`Deleted ended giveaway: ${messageId}`);
    } catch (error) {
        console.error(
            `Error handling giveaway end for message ID ${messageId}:`,
            error
        );
    }
}

export function selectRandomWinners(
    participants: string[],
    count: number
): string[] {
    const shuffled = participants.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length)); // Ensure not to exceed the number of participants
}

export async function getGiveawayStatus(channelId: string, messageId: string) {
    try {
        const giveaway = await Giveaway.findOne({ channelId, messageId });
        if (!giveaway) throw new Error("No giveaway found");
        return giveaway;
    } catch (error) {
        console.error("Error fetching giveaway status:", error);
        return null;
    }
}

export async function setGiveaway(
    channelId: string,
    messageId: string,
    prize: string,
    winnerCount: number,
    days: number,
    hours: number,
    minutes: number
) {
    try {
        const deadline = createUtcDate(days, hours, minutes); // Create the deadline in UTC
        const giveaway = new Giveaway({
            channelId,
            messageId,
            prize,
            winnerCount,
            deadline,
            createdAt: new Date(),
        });

        await giveaway.save();
        return true;
    } catch (error) {
        console.error("Error creating giveaway:", error);
        return false;
    }
}

export async function deleteGiveaway(channelId: string, messageId: string) {
    try {
        const giveaway = await Giveaway.findOneAndDelete({
            channelId,
            messageId,
        });
        if (!giveaway) throw new Error("No giveaway found");
        return true;
    } catch (error) {
        console.error("Error deleting giveaway:", error);
        return false;
    }
}

export async function isGiveawayExpired(channelId: string, messageId: string) {
    try {
        const giveaway = await Giveaway.findOne({ channelId, messageId });
        if (!giveaway) throw new Error("No giveaway found");
        return new Date() > giveaway.deadline;
    } catch (error) {
        console.error("Error checking giveaway expiration:", error);
        return null;
    }
}

export async function giveawayCount() {
    try {
        return await Giveaway.countDocuments();
    } catch (error) {
        console.error("Error fetching giveaways: ", error);
        return null;
    }
}

export async function fetchAllGiveaways() {
    try {
        return await Giveaway.find();
    } catch (error) {
        console.error("Error fetching giveaways: ", error);
        return null;
    }
}
