import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import {
    addStickyMessage,
    getAllStickyMessage,
} from "../../modules/StickyMessage";

export default {
    data: new SlashCommandBuilder()
        .setName("set_sticky_channel")
        .setDescription("Adds sticky message to a target channel")
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
            const allStickyMessages = await getAllStickyMessage();
            if (allStickyMessages.length > 0) {
                for (const SM of allStickyMessages) {
                    if (SM.channelId === channel.id) {
                        console.log(SM.channelId);
                        console.log(channel.id);
                        await interaction.editReply({
                            content:
                                "Sticky message is already set to that channel",
                        });
                        return;
                    }
                }
            }

            const success = await addStickyMessage(channel.id);
            if (!success) {
                await interaction.editReply({
                    content:
                        "There is a problem with adding the sticky message",
                });
                return;
            }
            await interaction.editReply({
                content: `Sticky Message for channel: ${channel} has been set`,
            });
            return;
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error setting the sticky message: ${errorMessage}`,
            });
            return;
        }
    },
};
