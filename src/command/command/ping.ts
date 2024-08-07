import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    async execute(interaction: CommandInteraction) {
        const delay = Math.abs(Date.now() - interaction.createdTimestamp);
        await interaction.reply(`Delay: ${delay}ms - Pong!`);
    },
};
