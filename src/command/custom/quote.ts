import Quote from '@/entity/quote';
import { AppDataSource } from '@/helper/datasource';
import { CustomOptions } from '@/infrastructure/client';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';

export default [
    {
        name: '%',
        description: 'Save quote',
        async execute(message: Message, options: CustomOptions) {
            const param = options.param;
            const content = options.content;
            const serverId = message.guildId;
            const quoteRepository = AppDataSource.getRepository(Quote);

            if (!serverId) {
                await message.reply('❌ You cannot use this command in DM');
                return;
            }

            if (!param) {
                await message.reply('❌ Invalid parameters');
                return;
            }

            if (!content) {
                const attachments = message.attachments;
                if (!attachments.size) {
                    await message.reply('❌ Invalid parameters');
                    return;
                }

                const entites: Quote[] = attachments
                    .filter((attachment) => attachment.contentType?.startsWith('image'))
                    .map((attachment) => {
                        const quote = new Quote();
                        quote.serverId = serverId;
                        quote.identifier = param;
                        quote.content = attachment.url;
                        return quote;
                    });

                await quoteRepository.insert(entites);
                await message.reply('✅ Saved');
                return;
            }

            const quote = new Quote();
            quote.content = content;
            quote.serverId = serverId;
            quote.identifier = param;
            await quoteRepository.insert(quote);
            await message.reply('✅ Saved');
            return;
        },
    },
    {
        name: '%%',
        description: 'Get quote',
        async execute(message: Message, options: CustomOptions) {
            const param = options.param;
            const serverId = message.guildId;

            if (!param) {
                await message.reply('❌ Invalid parameters');
                return;
            }

            if (!serverId) {
                await message.reply('❌ You cannot use this command in DM');
                return;
            }

            const quoteRepository = AppDataSource.getRepository(Quote);
            const quotes = await quoteRepository.find({
                where: {
                    serverId: serverId,
                    identifier: param,
                },
            });

            if (!quotes.length) {
                await message.reply('❌ No result');
                return;
            }

            const random = new ButtonBuilder().setCustomId('random').setEmoji('🔁').setStyle(ButtonStyle.Primary);
            const button = new ActionRowBuilder<ButtonBuilder>().addComponents([random]);

            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            let msg: Message;
            if (quote.content.startsWith('https://cdn.discordapp.com/attachments')) {
                msg = await message.reply({ files: [quote.content], components: quotes.length > 1 ? [button] : [] });
            } else {
                msg = await message.reply({ content: quote.content, components: quotes.length > 1 ? [button] : [] });
            }

            const mc = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30 * 1000 });

            mc.on('collect', async (i) => {
                if (i.user.id !== message.author.id) {
                    await i.reply({ content: '❌ You are not allowed to do this!', ephemeral: true });
                    return;
                }

                await i.deferUpdate();

                const newQuote = quotes[Math.floor(Math.random() * quotes.length)];

                if (i.customId === 'random') {
                    if (quote.content.startsWith('https://cdn.discordapp.com/attachments')) {
                        msg = await message.edit({ files: [newQuote.content], components: quotes.length > 1 ? [button] : [] });
                    } else {
                        msg = await message.edit({ content: newQuote.content, components: quotes.length > 1 ? [button] : [] });
                    }
                }

                mc.resetTimer();
            });
        },
    },
];
