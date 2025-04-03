import { ContextMenuCommandBuilder, ApplicationCommandType, CommandInteraction, ContextMenuCommandType } from 'discord.js';

export default {
    data: new ContextMenuCommandBuilder().setName('Ping !').setType(ApplicationCommandType.User as ContextMenuCommandType),
    execute: async (interaction: CommandInteraction) => {
        const delay = Math.abs(Date.now() - interaction.createdTimestamp);
        await interaction.reply(`Delay: ${delay}ms - Pong!`);
    },
};
