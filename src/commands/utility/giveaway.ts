import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMemberRoleManager,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    MessageReaction,
    User,
} from "discord.js";
import {
    deleteGiveaway,
    getGiveawayStatus,
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

        const channel = interaction.options.getChannel("channel");
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
                    `**\nPrize: \`${prize}\`**\n\n**Giveaway ends at:** \`${formattedDeadline}\``
                )
                .setColor("White");

            const message = await (channel as TextChannel).send({
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

            // Start the reaction collector
            const filter = (reaction: MessageReaction, user: User) => {
                console.log(reaction);
                console.log(user);
                return !user.bot && reaction.emoji.name === "🎉"; // Exclude bot reactions and only allow the specified emoji
            };

            const collector = message.createReactionCollector({
                filter,
                time: deadline.getTime() - Date.now(),
            });

            console.log(collector);

            // Store participants' IDs
            let participants: string[] = [];

            collector.on("collect", (reaction, user) => {
                console.log(reaction);
                console.log(`Reaction collected from ${user.username}`);
                if (!user.bot && !participants.includes(user.id)) {
                    participants.push(user.id);
                    console.log(`${user.username} has entered the giveaway.`);
                }
            });

            collector.on("end", async () => {
                if (participants.length === 0) {
                    await (channel as TextChannel).send(
                        "No participants entered the giveaway."
                    );
                    return;
                }

                // Select winners
                const winners = selectRandomWinners(participants, winnerCount);
                const winnersString = winners
                    .map((winnerId) => `<@${winnerId}>`)
                    .join(", ");

                // Send winners announcement
                const endEmbed = new EmbedBuilder()
                    .setTitle("GIVEAWAY ENDED")
                    .setDescription(`Winners: ${winnersString}`)
                    .setColor("Green");

                await (channel as TextChannel).send({
                    allowedMentions: { parse: ["roles"] },
                    embeds: [endEmbed],
                });
                await deleteGiveaway(channel.id, message.id);
                console.log("Deleted ended giveaway on DB");
            });

            console.log(await getGiveawayStatus(channel.id, message.id));
        } catch (error) {
            const errorMessage = (error as Error).message;
            await interaction.editReply({
                content: `There was an error making the giveaway: ${errorMessage}`,
            });
        }
    },
};
