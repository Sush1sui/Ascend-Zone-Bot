import {
    ActivityType,
    Client,
    Collection,
    GatewayIntentBits,
} from "discord.js";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { CustomClient } from "./Types";

export const verifiedRoleIDs = [
    "967418794807033906",
    "1181608321002782780",
    "1181609832457973810",
    "1181610191792381962",
];

export function startBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions,
        ],
    }) as CustomClient;

    client.commands = new Collection();

    const foldersPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".ts"));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ("data" in command.default && "execute" in command.default) {
                client.commands.set(command.default.data.name, command.default);
            } else {
                console.log(
                    `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }

    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".ts"));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath).default;
        if (event) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } else {
            console.error(
                `Failed to load event from ${filePath}: No default export found.`
            );
        }
    }

    client.once("ready", () => {
        // Set bot's status to 'online' and activity to 'Playing a game'
        client.user?.setPresence({
            status: "online", // online, idle, dnd, invisible
            activities: [
                {
                    name: "with Ascend Zone!", // The activity message
                    type: ActivityType.Playing, // The activity type (Playing, Streaming, Listening, Watching)
                },
            ],
        });
    });

    client.login(process.env.bot_token);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});
