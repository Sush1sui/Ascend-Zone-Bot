import { Client, Events } from "discord.js";
import deployCommands from "../deploy-commands";

// event handler for making bot online
export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        if (!client.user) {
            console.log(client);
            console.log("client user not found");
            return;
        }
        deployCommands();
        console.log(`Logged in as ${client.user.tag}`);
    },
};
