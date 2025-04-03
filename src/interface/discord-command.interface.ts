import { CommandInteraction, ContextMenuCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export interface DiscordCommand {
    data: SlashCommandOptionsOnlyBuilder | ContextMenuCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
}
