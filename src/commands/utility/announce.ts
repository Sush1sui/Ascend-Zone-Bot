import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMemberRoleManager,
    NewsChannel,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import extractMentions from "../../UTILS";

const STAFF_ID = process.env.STAFF_ID;
if (!STAFF_ID) throw new Error("No staff ID");

export default {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Send an announcement message on a target channel")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription(
                    "The channel where the verification message will be sent"
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("title")
                .setDescription("Announcement Title")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription(
                    "Message body (4096 characters maximum, 2000 characters paste limit, type \n to break line)"
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("roles")
                .setDescription("Ex. @Role1, @Role2, @Role3")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("users")
                .setDescription("Ex. @User1, @User2, @User3")
                .setRequired(false)
        )
        .addAttachmentOption((option) =>
            option
                .setName("attachment")
                .setDescription("Attach an image or file")
                .setRequired(false)
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

        console.log("Announcement command triggered");

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

        const channel = interaction.options.getChannel("channel");
        const title = interaction.options.getString("title");
        const message = interaction.options.getString("message");
        const roleNames = interaction.options.getString("roles");
        const userNames = interaction.options.getString("users");
        const attachment = interaction.options.getAttachment("attachment");

        const rolePings = extractMentions(roleNames || "");
        const userPings = extractMentions(userNames || "");

        if (!channel) {
            await interaction.editReply({
                content: "Channel is required.",
            });
            return;
        }

        if (!title) {
            await interaction.editReply({
                content: "Title is required.",
            });
            return;
        }

        if (!message) {
            await interaction.editReply({
                content: "Message is required.",
            });
            return;
        }

        if (message.length > 4096) {
            await interaction.editReply({
                content: `Embed message is limited to only 4096 characters. Message character count: ${message.length}`,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor("White")
            .setTitle(title)
            .setDescription(message?.replace(/\\n/g, "\n") ?? ""); // preservers line breaks

        // Check if there's an attachment and if it's an image
        if (attachment && attachment.url) {
            const isImageOrGif = attachment.contentType?.startsWith("image/");
            if (isImageOrGif) {
                embed.setImage(attachment.url); // Set the attachment URL if it's an image
            } else {
                await interaction.editReply({
                    content: "The attached file is not an image or GIF.",
                });
                return;
            }
        } else {
            console.log("No valid attachment found");
        }

        try {
            await (channel as TextChannel | NewsChannel).send({
                content: `${rolePings} ${userPings}`,
                allowedMentions: { parse: ["roles", "users", "everyone"] },
                embeds: [embed],
            });

            await interaction.editReply({
                content: `**Announcement sent to ${channel}**`,
            });
        } catch (error) {
            // Type assertion to Error
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error sending the announcement: ${errorMessage}`,
            });
        }
    },
};
