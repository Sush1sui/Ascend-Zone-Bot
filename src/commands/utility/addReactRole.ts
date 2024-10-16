import {
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import {
    createReactRole,
    setupReactionCollector,
} from "../../modules/ReactRole";

const STAFF_ID = process.env.STAFF_ID;
if (!STAFF_ID) throw new Error("No staff ID");

export default {
    data: new SlashCommandBuilder()
        .setName("add_react_role")
        .setDescription("Adds a react role on a specific message")
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
        .addStringOption((option) =>
            option
                .setName("emoji")
                .setDescription("The emoji of the react role")
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
        const emoji_string = interaction.options.getString("emoji");
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

        if (!emoji_string) {
            await interaction.editReply({
                content: "Emoji is required.",
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
            const message_target = await channel.messages.fetch(
                message_id_string
            );

            await message_target.react(emoji_string);

            await createReactRole(
                channel.id,
                message_id_string,
                emoji_string,
                role.id
            );

            setupReactionCollector(message_target, emoji_string, role.id);

            await interaction.editReply({
                content: `Successfully added react role to the message.`,
            });
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error making the giveaway: ${errorMessage}`,
            });
        }
    },
};
