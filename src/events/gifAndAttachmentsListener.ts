import { GuildMember, Message } from "discord.js";

const staff_id = process.env.STAFF_ID;
const booster_id = process.env.BOOSTER_ROLE_ID;
const custom_role_pass_id = process.env.CUSTOME_ROLE_PASS;

if (!staff_id || !booster_id || !custom_role_pass_id)
    throw new Error(
        "Staff or Booster role ID is not defined in environment variables."
    );

const CHANNEL_EXCEPTION = [
    "972883934281101392",
    "1140719367366123541",
    "1274400505744855142",
    "1149557123999604867",
    "1152225163698516050",
    "1157929158026993745",
    "967416435410337847",
];

export default {
    name: "messageCreate",
    once: false,
    async execute(message: Message): Promise<void> {
        try {
            // Ignore messages sent by bots or in exception channels
            if (
                message.author.bot ||
                CHANNEL_EXCEPTION.includes(message.channel.id)
            )
                return;

            const member = message.member as GuildMember;
            if (!member) return;

            const hasAuthorizedRole =
                member.roles.cache.has(staff_id) ||
                member.roles.cache.has(booster_id) ||
                member.roles.cache.has(custom_role_pass_id);

            if (hasAuthorizedRole) return;

            const hasAttachments = message.attachments.size > 0;
            const hasGIFsOrLinks =
                /https?:\/\/\S+\.(gif|jpg|jpeg|png|mp4|webm|mov|avi|mkv)|https?:\/\/tenor.com\/view\/\S+/i.test(
                    message.content
                );

            if (hasAttachments || hasGIFsOrLinks) {
                await message.delete();
                console.log(
                    `Deleted a message from ${message.author.tag} in ${message.channel}`
                );
            }
        } catch (error) {
            console.error(
                `Failed to delete message: ${(error as Error).message}`
            );
        }
    },
};
