import {
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { deleteGiveaway } from "../../modules/Giveaway";

const STAFF_ID = process.env.STAFF_ID;
if (!STAFF_ID) throw new Error("No staff ID");

export default {
    data: new SlashCommandBuilder()
        .setName("delete_giveaway")
        .setDescription("Deletes currently active giveaway")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription(
                    "The channel where the giveaway to be deleted is located"
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("message_id")
                .setDescription("The message id of the giveaway embed message")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.member || !interaction.guild) {
            await interaction.reply({
                content: "This command can only be used in a guild.",
                ephemeral: true,
            });
            return;
        }

        console.log("Giveaway command is triggered");

        const guildMember = interaction.member
            .roles as unknown as GuildMemberRoleManager;

        const isStaff = guildMember.cache.has(STAFF_ID);

        if (!isStaff) {
            await interaction.reply({
                content: "Staff Role is needed to use this command.",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel(
            "channel"
        ) as TextChannel;
        const messageId = interaction.options.getString("message_id");

        if (!channel) {
            await interaction.editReply({
                content: "Channel is required.",
            });
            return;
        }

        if (!messageId) {
            await interaction.editReply({
                content: "Message ID is required.",
            });
            return;
        }

        try {
            const message = await channel.messages.fetch(messageId);

            if (!message) {
                await interaction.editReply({
                    content: "Message not found in the specified channel.",
                });
                return;
            }

            await message.delete();
            await deleteGiveaway(channel.id, messageId);

            await interaction.editReply({
                content: "Giveaway message successfully deleted.",
            });
        } catch (error) {
            console.error("Error deleting the message:", error);
            await interaction.editReply({
                content:
                    "Failed to delete the message. Please ensure the message ID is correct and the bot has the required permissions.",
            });
        }
    },
};
