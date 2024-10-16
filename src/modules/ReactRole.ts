import {
    Message,
    MessageReaction,
    User,
    Client,
    TextChannel,
} from "discord.js";
import ReactRole from "../Models/ReactRoles.model";

export async function fetchAllReactRoles() {
    try {
        return await ReactRole.find();
    } catch (error) {
        console.error("Error fetching React Roles: ", error);
        return null;
    }
}

export async function fetchReactRolesArray(
    channelId: string,
    messageId: string
) {
    try {
        const reactRole = await ReactRole.findOne({ channelId, messageId });

        if (!reactRole) {
            console.log(
                `No react roles found for channel: ${channelId}, message: ${messageId}`
            );
            return null;
        }

        return reactRole.reactRoles;
    } catch (error) {
        console.error("Error fetching react roles: ", error);
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
        const validEmoji = isValidEmoji(inputEmoji);

        if (!validEmoji) throw new Error("Emoji is not valid");

        const existingReactRole = await ReactRole.findOne({
            channelId,
            messageId,
        });

        if (!existingReactRole) {
            const updatedReactRoleMessage = await ReactRole.create({
                channelId,
                messageId,
                reactRoles: [{ emoji: inputEmoji, roleId }],
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
            { $push: { reactRoles: { emoji: inputEmoji, roleId } } },
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

        const deletedReactRole = await ReactRole.findOneAndUpdate(
            { channelId, messageId },
            { $pull: { reactRoles: { roleId } } },
            { new: true }
        );

        if (!deletedReactRole) throw new Error("Couldn't delete react role");

        if (deletedReactRole.reactRoles.length <= 0) {
            await ReactRole.findOneAndDelete({ channelId, messageId });
        }

        console.log(
            `Removed reaction role with role ID: ${roleId} from message ID: ${messageId}`
        );
        return reactRole;
    } catch (error) {
        console.error("Error deleting react role: ", error);
        return null;
    }
}

export function isValidEmoji(inputEmoji: string): boolean {
    const customEmojiRegex = /^<a?:\w+:\d+>$/; // Custom emoji
    const unicodeEmojiRegex = /\p{Extended_Pictographic}/u; // Unicode emoji
    return (
        customEmojiRegex.test(inputEmoji) || unicodeEmojiRegex.test(inputEmoji)
    );
}

export function extractEmojiId(emojiString: string) {
    // Regular expression to match custom emoji format <a:emojiName:emojiId> or <:emojiName:emojiId>
    const regex = /<a?:(\w+):(\d+)>/; // Matches both animated and non-animated custom emojis
    const match = emojiString.match(regex);

    if (match) {
        return match[2]; // Return the emoji ID
    }
    return null; // Return null if no match is found
}

// Function to set up the reaction collector
export const setupReactionCollector = async (
    message: Message,
    emoji: string,
    roleId: string
) => {
    console.log(
        `Setting up reaction collector for emoji: ${emoji} on message: ${message.id}`
    );

    // Filter to check if the user is not a bot and if the emoji matches
    const filter = (reaction: MessageReaction, user: User) => {
        const emojiId = extractEmojiId(emoji);
        if (!emojiId) throw new Error("Error extracting emoji ID");
        return !user.bot && reaction.emoji.id === emojiId;
    };

    const collector = message.createReactionCollector({
        filter,
        dispose: true,
    });

    // Handle reaction added
    collector.on("collect", async (reaction, user) => {
        console.log(
            `Reaction collected: ${reaction.emoji.name} by ${user.tag}`
        );
        const member = await reaction.message.guild?.members.fetch(user.id);
        if (member) {
            try {
                if (!reaction.message.guild) throw new Error("No react roles");
                // Fetch the role using roleId
                const role = await reaction.message.guild.roles.fetch(roleId);
                if (role) {
                    // Assign the role to the member
                    await member.roles.add(role);
                    console.log(
                        `Assigned role ${role.name} to ${member.user.tag}`
                    );
                } else {
                    console.error(`Role with ID ${roleId} not found.`);
                }
            } catch (error) {
                console.error(
                    `Failed to assign role ${roleId} to ${member.user.tag}: ${error}`
                );
            }
        }
    });

    // Handle reaction removed
    collector.on("remove", async (reaction, user) => {
        console.log(`Reaction removed: ${reaction.emoji.name} by ${user.tag}`);
        const member = await reaction.message.guild?.members.fetch(user.id);
        if (member) {
            try {
                if (!reaction.message.guild) throw new Error("No react roles");
                // Fetch the role using roleId
                const role = await reaction.message.guild.roles.fetch(roleId);
                if (role) {
                    // Remove the role from the member
                    await member.roles.remove(role);
                    console.log(
                        `Removed role ${role.name} from ${member.user.tag}`
                    );
                } else {
                    console.error(`Role with ID ${roleId} not found.`);
                }
            } catch (error) {
                console.error(
                    `Failed to remove role ${roleId} from ${member.user.tag}: ${error}`
                );
            }
        }
    });
};

// Initialization function to set up all existing react roles on startup
export async function initializeReactionRoles(client: Client) {
    // Get the first guild the bot is in
    const guild = client.guilds.cache.first();

    if (!guild) {
        console.error("Bot is not in any guild.");
        return;
    }

    try {
        // Fetch all channels for the guild
        const channels = await guild.channels.fetch();
        const reactRoles = await fetchAllReactRoles(); // Fetch all react roles

        if (!reactRoles) throw new Error("No react roles");

        for (const channel of channels.values()) {
            // Check if the channel is a text channel
            if (channel instanceof TextChannel) {
                // Filter react roles for the current channel
                const filteredReactRoles = reactRoles.filter(
                    (role) => role.channelId === channel.id
                );

                for (const { messageId, reactRoles } of filteredReactRoles) {
                    for (const { emoji, roleId } of reactRoles) {
                        try {
                            // Fetch the message by ID
                            const message = await channel.messages.fetch(
                                messageId
                            );
                            if (!message) {
                                console.error(
                                    `Message with ID ${messageId} not found in channel ${channel.id}`
                                );
                                return;
                            }
                            // Set up the reaction collector for the message
                            setupReactionCollector(message, emoji, roleId);
                            console.log(
                                `Initialized react role ${roleId} for emoji ${emoji} in channel ${channel.id}`
                            );
                        } catch (error) {
                            console.error(
                                `Failed to fetch message or setup collector: ${error}`
                            );
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error initializing reaction roles: ${error}`);
    }
}
