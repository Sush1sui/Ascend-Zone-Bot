import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { deleteStickyMessage } from "../../modules/StickyMessage";

export default {
    data: new SlashCommandBuilder()
        .setName("unset_sticky_message")
        .setDescription("Unsets the sticky message to a target channel")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription(
                    "The channel where the sticky message will be set"
                )
                .setRequired(true)
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

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel(
            "channel"
        ) as TextChannel;

        try {
            const success = await deleteStickyMessage(channel.id);
            if (success === "sticky not found") {
                await interaction.editReply({
                    content: `Sticky Message is not set on channel: ${channel}`,
                });
                return;
            }
            await interaction.editReply({
                content: `Sticky Message for channel: ${channel} has been unset`,
            });
            return;
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error sending the announcement: ${errorMessage}`,
            });
            return;
        }
    },
};
