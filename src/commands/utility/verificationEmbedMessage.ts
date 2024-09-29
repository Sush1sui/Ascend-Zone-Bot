import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import {
    getVerificationMessageStatus,
    setVerificationChannelID,
    setVerificationMessageID,
    setVerificationStatus,
} from "../../modules/Verification";
import { verifiedRoleIDs } from "../../app";

export default {
    data: new SlashCommandBuilder()
        .setName("add_verification_message")
        .setDescription("Send a verification embed message on a target channel")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription(
                    "The channel where the verification message will be sent"
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

        if ((await getVerificationMessageStatus()) === true) {
            await interaction.reply({
                content: "There is already an existing verification message",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel("channel");

        const embedMessage = new EmbedBuilder()
            .setTitle("Welcome to Ascend Zone!")
            .setColor(0x008000)
            .setDescription(
                "To continue on with your adventure to this Fantastic Community, Please do verify your account first to have a access of all channels."
            );

        const button = new ButtonBuilder()
            .setCustomId("verify_button")
            .setEmoji("1161201857025298452")
            .setStyle(ButtonStyle.Success);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            button
        );

        try {
            const message = await (channel as TextChannel).send({
                embeds: [embedMessage],
                components: [actionRow],
            });

            const collector = message.createMessageComponentCollector();

            collector.on("collect", async (buttonInteraction) => {
                // Check if the interaction is a button interaction
                if (!buttonInteraction.isButton()) return;

                // Check if it's the right button
                if (buttonInteraction.customId !== "verify_button") return;

                const member = buttonInteraction.member;
                if (!member || !interaction.guild) {
                    await buttonInteraction.reply({
                        content: "This command can only be used in a guild.",
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    const roles = verifiedRoleIDs
                        .map((roleId) =>
                            interaction.guild?.roles.cache.get(roleId)
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

            // Edit the initial deferred reply to confirm the action was successful
            await interaction.editReply({
                content: "The verification message has been sent successfully!",
            });

            await setVerificationChannelID(channel?.id);
            await setVerificationMessageID(message.id);
            await setVerificationStatus(true);
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error sending the announcement: ${errorMessage}`,
            });
        }
    },
};
