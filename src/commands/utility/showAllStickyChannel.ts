import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { getAllStickyMessageChannelID } from "../../modules/StickyMessage";

export default {
    data: new SlashCommandBuilder()
        .setName("show_all_sticky_channels")
        .setDescription("Shows all channels that has sticky message active"),

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

        const channel = interaction.channel as TextChannel;

        try {
            const allStickyChannelIDs = await getAllStickyMessageChannelID();
            if (allStickyChannelIDs.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("NO STICKY CHANNELS FOUND")
                    .setDescription(
                        `There are no channels found, try adding a channel for sticky message`
                    )
                    .setColor("White");

                await channel.send({
                    embeds: [embed],
                });
                await interaction.editReply({
                    content: "No channels found",
                });
                return;
            }
            let stickyChannelMentionString = "";

            for (let i = 0; i < allStickyChannelIDs.length; ++i) {
                if (i < allStickyChannelIDs.length) {
                    stickyChannelMentionString += `<#${allStickyChannelIDs[i]}>\n`;
                } else {
                    stickyChannelMentionString += `<#${allStickyChannelIDs[i]}>`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle("STICKY CHANNELS LIST")
                .setDescription(stickyChannelMentionString)
                .setColor("DarkBlue");

            await channel.send({
                embeds: [embed],
            });
            await interaction.editReply({
                content: "Channels fetched successfully",
            });
            return;
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error fetching the channels: ${errorMessage}`,
            });
            return;
        }
    },
};
