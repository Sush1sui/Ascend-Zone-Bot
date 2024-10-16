import { Client, Events } from "discord.js";
import deployCommands from "../deploy-commands";
import { initializeVerificationCollector } from "../modules/Verification";
import { initializeGiveawayTimeouts } from "../modules/Giveaway";
import { initializeReactionRoles } from "../modules/ReactRole";

// event handler for making bot online
export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        if (!client.user) {
            console.log(client);
            console.log("client user not found");
            return;
        }
        deployCommands();
        console.log(`Logged in as ${client.user.tag}`);

        await initializeVerificationCollector(client);
        await initializeGiveawayTimeouts(client);
        await initializeReactionRoles(client);
    },
};
