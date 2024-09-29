import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import {
    getVerificationChannelID,
    getVerificationMessageID,
    getVerificationMessageStatus,
    setVerificationChannelID,
    setVerificationMessageID,
    setVerificationStatus,
} from "../../modules/Verification";

export default {
    data: new SlashCommandBuilder()
        .setName("remove_verification_message")
        .setDescription("Removes current active verification message")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("_")
                .setDescription("Removes currently active verification message")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member;
        if (!member || !interaction.guild) {
            await interaction.reply({
                content: "This command can only be used in a guild.",
                ephemeral: true,
            });
            return;
        }

        const verificationMessageStatus = await getVerificationMessageStatus();
        if (verificationMessageStatus === false) {
            await interaction.reply({
                content: "There is no verification message active",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const channelId = await getVerificationChannelID();
        const messageId = await getVerificationMessageID();
        if (channelId === null || messageId === null) {
            await interaction.followUp({
                content: "Unable to retrieve channel or message ID.",
                ephemeral: true,
            });
            return;
        }

        const channel = interaction.guild.channels.cache.get(
            channelId
        ) as TextChannel;

        if (!channel) {
            await interaction.followUp({
                content: "Could not find the channel.",
                ephemeral: true,
            });
            return;
        }

        try {
            const message = await channel.messages.fetch(messageId);

            if (message) {
                await message.delete();
                await interaction.followUp({
                    content: "Verification message removed successfully.",
                    ephemeral: true,
                });

                await setVerificationStatus(false);
                await setVerificationChannelID(null);
                await setVerificationMessageID(null);
            } else {
                await interaction.followUp({
                    content: "No message found with the specified ID.",
                    ephemeral: true,
                });
            }
        } catch (error) {
            await interaction.followUp({
                content: `Error deleting the message: ${
                    (error as Error).message
                }`,
                ephemeral: true,
            });
        }
    },
};
