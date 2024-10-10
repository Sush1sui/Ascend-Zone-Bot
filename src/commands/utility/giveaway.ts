import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMemberRoleManager,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import {
    deleteGiveaway,
    selectRandomWinners,
    setGiveaway,
} from "../../modules/Giveaway";

const STAFF_ID = process.env.STAFF_ID;
if (!STAFF_ID) throw new Error("No staff ID");

export default {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Make a giveaway")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel where the giveaway will be posted")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("prize")
                .setDescription("Prize of the giveaway")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("winner_count")
                .setDescription("Winners count")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("day_count")
                .setDescription("Days before giveaway ends")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("hour_count")
                .setDescription("Hours before giveaway ends")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("minute_count")
                .setDescription("Minutes before giveaway ends")
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
        const prize = interaction.options.getString("prize");
        const winnerCount = interaction.options.getInteger("winner_count");
        const dayCount = interaction.options.getInteger("day_count") || 0;
        const hourCount = interaction.options.getInteger("hour_count") || 0;
        const minCount = interaction.options.getInteger("minute_count") || 0;

        if (!channel) {
            await interaction.editReply({
                content: "Channel is required.",
            });
            return;
        }

        if (!prize) {
            await interaction.editReply({
                content: "Prize is required.",
            });
            return;
        }
        if (prize.length <= 1) {
            await interaction.editReply({
                content:
                    "Prize character length should be longer than 1 character.",
            });
            return;
        }
        if (prize.length > 50) {
            await interaction.editReply({
                content:
                    "Prize character length should not exceed 50 characters.",
            });
            return;
        }
        if (!winnerCount) {
            await interaction.editReply({
                content: "Winner count is required.",
            });
            return;
        }

        try {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + dayCount);
            deadline.setHours(deadline.getHours() + hourCount);
            deadline.setMinutes(deadline.getMinutes() + minCount);

            const formattedDeadline = deadline.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });

            const embed = new EmbedBuilder()
                .setTitle("GIVEAWAY")
                .setDescription(
                    `**Prize: \`${prize}\`**\n**Number of winners: \`${winnerCount}\`**\n\n**Giveaway ends at:** \`${formattedDeadline}\`\n\n\`React "🎉" to join giveaway\``
                )
                .setColor("White");

            const message = await channel.send({
                content: "<@&967418794807033906>",
                allowedMentions: { parse: ["roles"] },
                embeds: [embed],
            });
            console.log(`Giveaway: ${message.id} is sent`);

            await message.react("🎉");

            await setGiveaway(
                channel.id,
                message.id,
                prize,
                winnerCount,
                deadline
            );
            console.log("Giveaway was saved to DB");
            await interaction.editReply({
                content: `Giveaway was sent to ${channel}`,
            });

            const timeLeft = deadline.getTime() - Date.now();

            // If the giveaway has already ended, handle it here
            if (timeLeft <= 0) {
                console.log(
                    `Giveaway with message ID ${message.id} has already ended.`
                );
                const endEmbed = new EmbedBuilder()
                    .setTitle("GIVEAWAY ENDED")
                    .setDescription(
                        `Giveaway with prize: \`${prize}\` has already ended`
                    )
                    .setColor("DarkOrange");

                await channel.send({
                    content: "<@&967418794807033906>",
                    allowedMentions: { parse: ["roles"] },
                    embeds: [endEmbed],
                });
                await deleteGiveaway(channel.id, message.id);
                console.log(`Deleted ended giveaway: ${message.id}`);
                return;
            }

            // Set a timeout for the giveaway
            setTimeout(async () => {
                try {
                    // Fetch all reactions to find participants
                    const reaction = message.reactions.cache.get("🎉");
                    let participants: string[] = [];

                    if (reaction) {
                        const users = await reaction.users.fetch();
                        participants = users
                            .filter((user) => !user.bot)
                            .map((user) => user.id);
                    }

                    if (participants.length === 0) {
                        const endEmbed = new EmbedBuilder()
                            .setTitle("GIVEAWAY ENDED")
                            .setDescription(
                                `No participants entered the giveaway for prize: \`${prize}\``
                            )
                            .setColor("DarkBlue");

                        await channel.send({
                            content: "<@&967418794807033906>",
                            allowedMentions: { parse: ["roles"] },
                            embeds: [endEmbed],
                        });
                    } else {
                        const winners = selectRandomWinners(
                            participants,
                            winnerCount
                        );
                        const winnersString = winners
                            .map((winnerId) => `<@${winnerId}>`)
                            .join(", ");

                        const endEmbed = new EmbedBuilder()
                            .setTitle("GIVEAWAY ENDED")
                            .setDescription(
                                `Prize: \`${prize}\`\n\nWinners: ${winnersString}`
                            )
                            .setColor("Green");

                        await channel.send({
                            content: "<@&967418794807033906>",
                            allowedMentions: { parse: ["roles"] },
                            embeds: [endEmbed],
                        });
                    }

                    await deleteGiveaway(channel.id, message.id);
                    console.log(`Deleted ended giveaway: ${message.id}`);
                } catch (error) {
                    console.error(
                        `Error handling giveaway end for message ID ${message.id}:`,
                        error
                    );
                }
            }, timeLeft);
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error making the giveaway: ${errorMessage}`,
            });
        }
    },
};
