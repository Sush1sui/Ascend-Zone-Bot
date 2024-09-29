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

let verificationMessagePresent = false;
let verificationMessageID: null | string | undefined = null;
let verificationChannelID: null | string | undefined = null;

export function setVerificationStatus(value: boolean) {
    verificationMessagePresent = value;
    return verificationMessagePresent;
}

export function getVerificationChannelID() {
    return verificationChannelID;
}

export function getVerificationMessageID() {
    return verificationMessageID;
}

export function setVerificationChannelID(value: string | null | undefined) {
    verificationChannelID = value;
    return verificationChannelID;
}

export function setVerificationMessageID(value: string | null | undefined) {
    verificationMessageID = value;
    return verificationMessageID;
}

export function getVerificationMessageStatus() {
    return verificationMessagePresent;
}

export function startBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
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
        const event = require(filePath);
        if (event.default.once) {
            console.log(event.default.name);
            client.once(event.default.name, (...args) =>
                event.default.execute(...args)
            );
        } else {
            console.log(event.default.name);
            client.on(event.default.name, (...args) =>
                event.default.execute(...args)
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
