import { BOT_FALLBACK_IMG, DEFAULT_SIMILARITY_POINT, PRIMARY_EMBED_COLOR } from '@helper/constant.helper';
import { GetUrlPath } from '@helper/util.helper';
import { ContextMenuCommandBuilder, ApplicationCommandType, CommandInteraction, EmbedBuilder, ContextMenuCommandType, Utils } from 'discord.js';
import sagiri from 'sagiri';

export default {
    data: new ContextMenuCommandBuilder().setName('SauceNAO').setType(ApplicationCommandType.User as ContextMenuCommandType),
    execute: async (interaction: CommandInteraction) => {
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
            console.log('[ERROR] SAUCENAO_APIKEY is required');
            return;
        }

        const client = sagiri(saucenaoApiKey);
        const result = await client(attachment.url);
        const filter = result.filter((x) => x.similarity >= DEFAULT_SIMILARITY_POINT);

        if (!filter.length) {
            await interaction.reply('❌ The similarity is too low');
            return;
        }

        const item = filter.sort((a, b) => a.similarity - b.similarity)[0];

        const embed = new EmbedBuilder()
            .setColor(PRIMARY_EMBED_COLOR)
            .setAuthor({
                name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL() || BOT_FALLBACK_IMG,
            })
            .setTitle(`[${item.site}] - ${item.authorName || 'Name not available'}`)
            .setURL(item.url)
            .setDescription(`Similarity: ${item.similarity} - ${item.raw.header.index_name}`)
            .setThumbnail(item.thumbnail)
            .setImage(item.thumbnail)
            .addFields({
                name: 'Ext urls: ',
                value: item.raw.data.ext_urls
                    .map((url) => {
                        return `- [${GetUrlPath(url)}](${url})`;
                    })
                    .join('\n'),
            })
            .setTimestamp()
            .setFooter({ text: 'KafkaBOT - SauceNAO', iconURL: interaction.client.user.avatarURL() || BOT_FALLBACK_IMG });

        await interaction.reply({ embeds: [embed] });
        return;
    },
};
