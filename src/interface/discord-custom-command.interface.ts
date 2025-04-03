import { Message } from 'discord.js';
import { DiscordCommandCustomOptions } from './discord-custom-option.interface';

export interface DiscordCustomCommand {
    name: string;
    description: string;
    parameters: string[];
    execute(message: Message, options: DiscordCommandCustomOptions): Promise<void> | void;
}
