import { Client, Events, TextChannel } from "discord.js";
import deployCommands from "../deploy-commands";
import {
    getVerificationChannelID,
    getVerificationMessageID,
} from "../modules/Verification";

// event handler for making bot online
export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        if (!client.user) {
            console.log(client);
            console.log("client user not found");
            return;
        }
        deployCommands();
        console.log(`Logged in as ${client.user.tag}`);

        // Retrieve verification details from the database
        const channelId = await getVerificationChannelID();
        const messageId = await getVerificationMessageID();

        if (channelId && messageId) {
            const channel = (await client.channels.fetch(
                channelId
            )) as TextChannel;
            if (channel) {
                try {
                    const message = await channel.messages.fetch(messageId);

                    // Attach the collector
                    const collector = message.createMessageComponentCollector();

                    collector.on("collect", async (buttonInteraction) => {
                        // Check if the interaction is a button interaction
                        if (!buttonInteraction.isButton()) return;

                        // Check if it's the right button
                        if (buttonInteraction.customId !== "verify_button")
                            return;

                        const roleIds = [
                            "967418794807033906",
                            "1181608321002782780",
                            "1181609832457973810",
                            "1181610191792381962",
                        ];

                        const member = buttonInteraction.member;
                        if (!member || !buttonInteraction.guild) {
                            await buttonInteraction.reply({
                                content:
                                    "This command can only be used in a guild.",
                                ephemeral: true,
                            });
                            return;
                        }

                        try {
                            const roles = roleIds
                                .map((roleId) =>
                                    buttonInteraction.guild?.roles.cache.get(
                                        roleId
                                    )
                                )
                                .filter(Boolean);

                            if (roles.length > 0) {
                                await (member as any).roles.add(roles); // Cast member to `GuildMember` to access `roles`
                                await buttonInteraction.reply({
                                    content:
                                        "You have been verified and roles have been assigned!",
                                    ephemeral: true,
                                });
                            } else {
                                await buttonInteraction.reply({
                                    content: "No roles were found to assign.",
                                    ephemeral: true,
                                });
                            }
                        } catch (error) {
                            const errorMessage = (error as Error).message;
                            await buttonInteraction.reply({
                                content: `There was an error assigning the roles: ${errorMessage}`,
                                ephemeral: true,
                            });
                        }
                    });

                    console.log("Verification collector has been initialized.");
                } catch (error) {
                    console.error(
                        `Failed to fetch verification message: ${
                            (error as Error).message
                        }`
                    );
                }
            }
        }
    },
};
