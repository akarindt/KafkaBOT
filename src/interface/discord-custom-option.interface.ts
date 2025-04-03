import { Collection } from 'discord.js';

export interface DiscordCommandCustomOptions {
    parameters: Collection<string, string | undefined>;
    content: string | undefined;
}
