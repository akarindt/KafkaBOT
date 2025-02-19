import WuwaSubscribe from '@/entity/wuwaSubscribe';
import { AppDataSource } from '@/helper/datasource';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export default [
    {
        data: new SlashCommandBuilder().setName('kfwuwa').setDescription('Subscribe from Wuthering Waves new codes notifications'),
        execute: async (interaction: CommandInteraction) => {
            let userId = interaction.user.id;
            const repository = AppDataSource.getRepository(WuwaSubscribe);
            const entity = new WuwaSubscribe();
            entity.userDiscordId = userId;
            try {
                await repository.insert(entity);
                await interaction.reply({ content: '✅ Subscribed successfully !', ephemeral: true });
                return;
            } catch (error) {
                await interaction.reply({ content: '❌ Something wrong happened', ephemeral: true });
                return;
            }
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfunwuwa').setDescription('Unsubscribe from Wuthering Waves new codes notifications'),
        execute: async (interaction: CommandInteraction) => {
            let userId = interaction.user.id;
            const repository = AppDataSource.getRepository(WuwaSubscribe);
            try {
                await repository.delete({ userDiscordId: userId });
                await interaction.reply({ content: '✅ Unsubscribed successfully !', ephemeral: true });
                return;
            } catch (error) {
                await interaction.reply({ content: '❌ Something wrong happened', ephemeral: true });
                return;
            }
        },
    },
];
