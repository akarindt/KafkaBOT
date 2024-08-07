import { ContextMenuCommandBuilder, ApplicationCommandType, CommandInteraction } from 'discord.js';
import sagiri from 'sagiri';

export default {
    data: new ContextMenuCommandBuilder().setName('SauceNAO').setType(ApplicationCommandType.Message),
    async execute(interaction: CommandInteraction) {
        const data = interaction.options.data;
        if (!data.length) return;

        const attachment = data[0].message?.attachments.first();

        if (!attachment) {
            await interaction.reply('❌ Image required.');
            return;
        }

        if (!attachment.contentType?.startsWith('image')) {
            await interaction.reply('❌ The attachment is in wrong format.');
            return;
        }

        const saucenaoApiKey = process.env.SAUCENAO_APIKEY;
        if (!saucenaoApiKey) {
            console.log('[ERR] SAUCENAO_APIKEY is required');
            return;
        }

        const client = sagiri(saucenaoApiKey);
        const result = await client(attachment.url);
        const filter = result.filter((x) => x.similarity >= 50);
        
        if(!filter.length) {
            await interaction.reply('❌ The similarity is too low')
            return;
        }

        

    },
};
