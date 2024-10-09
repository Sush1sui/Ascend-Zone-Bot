import { Client, TextChannel } from "discord.js";
import Verification from "../Models/Verification.model";
import { verifiedRoleIDs } from "../app";

export async function initializeVerificationCollector(client: Client) {
    // Retrieve verification details from the database
    const verificationChannelId = await getVerificationChannelID();
    const verificationMessageId = await getVerificationMessageID();

    if (verificationChannelId && verificationMessageId) {
        const channel = (await client.channels.fetch(
            verificationChannelId
        )) as TextChannel;
        if (channel) {
            try {
                const message = await channel.messages.fetch(
                    verificationMessageId
                );

                // Attach the collector
                const collector = message.createMessageComponentCollector();

                collector.on("collect", async (buttonInteraction) => {
                    // Check if the interaction is a button interaction
                    if (!buttonInteraction.isButton()) return;

                    // Check if it's the right button
                    if (buttonInteraction.customId !== "verify_button") return;

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
                        const roles = verifiedRoleIDs
                            .map((roleId) =>
                                buttonInteraction.guild?.roles.cache.get(roleId)
                            )
                            .filter(Boolean);

                        if (roles.length > 0) {
                            await (member as any).roles.add(roles); // Cast member to `GuildMember` to access `roles`
                            await buttonInteraction.reply({
                                content:
                                    "You have been verified and roles have been assigned!\n\n" +
                                    "Please get your roles here :C_tinyarrow~1: <#969034821177319445>",
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
}

export async function initializeVerification() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage === null) {
        const verificationMessage = new Verification({
            verificationMessagePresent: false,
            verificationChannelID: null,
            verificationMessageID: null,
        });
        await verificationMessage.save();
    }
}

export async function setVerificationStatus(value: boolean) {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage) {
        await existingVerificationMessage.updateOne({
            verificationMessagePresent: value,
            verificationChannelID:
                existingVerificationMessage.verificationChannelID,
            verificationMessageID:
                existingVerificationMessage.verificationMessageID,
        });
    }
}

export async function getVerificationChannelID() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage)
        return existingVerificationMessage.verificationChannelID;
    return null;
}

export async function getVerificationMessageID() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage)
        return existingVerificationMessage.verificationMessageID;
    return null;
}

export async function setVerificationChannelID(
    value: string | undefined | null
) {
    if (value === undefined) throw new Error("Value is undefined");
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage) {
        await existingVerificationMessage.updateOne({
            verificationChannelID: value,
            verificationMessageID:
                existingVerificationMessage.verificationMessageID,
            verificationMessagePresent:
                existingVerificationMessage.verificationMessagePresent,
        });
    }
}

export async function setVerificationMessageID(
    value: string | undefined | null
) {
    if (value === undefined) throw new Error("Value is undefined");
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage) {
        await existingVerificationMessage.updateOne({
            verificationMessageID: value,
            verificationChannelID:
                existingVerificationMessage.verificationChannelID,
            verificationMessagePresent:
                existingVerificationMessage.verificationMessagePresent,
        });
    }
}

export async function getVerificationMessageStatus() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage)
        return existingVerificationMessage.verificationMessagePresent;
    return null;
}
