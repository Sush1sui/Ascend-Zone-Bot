import { Client, Collection } from "discord.js";

export interface CustomClient extends Client {
    commands: Collection<string, any>;
}
