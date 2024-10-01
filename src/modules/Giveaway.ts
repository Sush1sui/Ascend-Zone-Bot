import { TextChannel, EmbedBuilder, Client } from "discord.js";
import Giveaway from "../Models/Giveaway.model";

export async function initializeGiveawayTimeouts(client: Client) {
    try {
        // Get all active giveaways from the database
        const activeGiveaways = await fetchAllGiveaways();

        if (activeGiveaways === null) return;

        // Iterate through each active giveaway
        for (const giveaway of activeGiveaways) {
            const { channelId, messageId, winnerCount, deadline } = giveaway;
            const channel = (await client.channels.fetch(
                channelId
            )) as TextChannel;

            // If the channel does not exist or is not a TextChannel, skip
            if (!channel || !(channel instanceof TextChannel)) continue;

            const endTime = new Date(deadline).getTime();
            const timeLeft = endTime - Date.now();

            // If the giveaway has already ended, handle it here
            if (timeLeft <= 0) {
                console.log(
                    `Giveaway with message ID ${messageId} has already ended.`
                );
                await deleteGiveaway(channelId, messageId);
                continue;
            }

            // Set a timeout for the giveaway
            setTimeout(async () => {
                try {
                    const message = await channel.messages.fetch(messageId);
                    if (!message) {
                        console.error(
                            `Message with ID ${messageId} not found.`
                        );
                        await deleteGiveaway(channelId, messageId);
                        return;
                    }

                    // Fetch all reactions to find participants
                    const reaction = message.reactions.cache.get("🎉");
                    let participants: string[] = [];

                    if (reaction) {
                        const users = await reaction.users.fetch();
                        console.log(users);
                        participants = users
                            .filter((user) => !user.bot)
                            .map((user) => user.id);
                    }

                    if (participants.length === 0) {
                        await channel.send(
                            "No participants entered the giveaway."
                        );
                    } else {
                        const winners = selectRandomWinners(
                            participants,
                            winnerCount
                        );
                        const winnersString = winners
                            .map((winnerId) => `<@${winnerId}>`)
                            .join(", ");

                        const endEmbed = new EmbedBuilder()
                            .setTitle("GIVEAWAY ENDED")
                            .setDescription(`Winners: ${winnersString}`)
                            .setColor("Green");

                        await channel.send({
                            allowedMentions: { parse: ["roles"] },
                            embeds: [endEmbed],
                        });
                    }

                    await deleteGiveaway(channelId, messageId);
                    console.log(`Deleted ended giveaway: ${messageId}`);
                } catch (error) {
                    console.error(
                        `Error handling giveaway end for message ID ${messageId}:`,
                        error
                    );
                }
            }, timeLeft);
        }
    } catch (error) {
        console.error("Error initializing giveaway timeouts:", error);
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
    deadline: Date
) {
    try {
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
        console.log("Deleted giveaway: ", giveaway);
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
