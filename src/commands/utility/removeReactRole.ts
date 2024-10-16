import {
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { deleteReactRole, extractEmojiId } from "../../modules/ReactRole";

const STAFF_ID = process.env.STAFF_ID;
if (!STAFF_ID) throw new Error("No staff ID");

export default {
    data: new SlashCommandBuilder()
        .setName("remove_react_role")
        .setDescription("Removes react role on a specific message")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel where the giveaway will be posted")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("message_id")
                .setDescription("Message ID of the message")
                .setRequired(true)
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("The role to be given for the react event")
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
        const message_id_string = interaction.options.getString("message_id");
        const role = interaction.options.getRole("role");

        if (!channel) {
            await interaction.editReply({
                content: "Channel is required.",
            });
            return;
        }

        if (!message_id_string) {
            await interaction.editReply({
                content: "Message ID is required.",
            });
            return;
        }

        if (!role) {
            await interaction.editReply({
                content: "Role is required.",
            });
            return;
        }

        try {
            const deletedReactRole = await deleteReactRole(
                channel.id,
                message_id_string,
                role.id
            );

            if (!deletedReactRole) throw new Error("No deleted react role");

            const messageTarget = await channel.messages.fetch(
                message_id_string
            );

            if (!deletedReactRole.reactRoles) throw new Error("No react roles");

            for (const reactRole of deletedReactRole.reactRoles) {
                if (reactRole.roleId === role.id) {
                    const emojiId = extractEmojiId(reactRole.emoji);
                    if (!emojiId) throw new Error("Failed to extract emoji id");
                    const reaction = messageTarget.reactions.cache.get(emojiId);
                    if (reaction) await reaction.remove();
                }
            }

            await interaction.editReply({
                content: "Successfully removed the react role.",
            });
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error making the giveaway: ${errorMessage}`,
            });
        }
    },
};
