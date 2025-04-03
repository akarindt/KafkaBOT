import Quote from '@entity/quote.entity';
import { AppDataSource } from '@helper/datasource.helper';
import { v2 } from 'cloudinary';
import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message, MessageEditOptions, MessageReplyOptions } from 'discord.js';
import {
    BOT_IMAGE_FOLDER,
    CLOUDINARY_IMAGE_CROP,
    CLOUDINARY_IMAGE_FORMAT,
    CLOUDINARY_IMAGE_QUALITY,
    CLOUDINARY_IMAGE_WIDTH,
    EXCHANGE_API,
    EXCHANGE_API_FALLBACK,
    IMAGE_LIMIT_SIZE,
} from '@helper/constant.helper';
import { CurrencyResponse, DiscordCommandCustomOptions } from '@/interface';
import { ImageEmbed, SendCurrencyExchangeInfo } from '@helper/util.helper';

export default [
    {
        name: '%',
        description: 'Save quote',
        parameters: ['identifier'],
        execute: async (message: Message, options: DiscordCommandCustomOptions) => {
            const param = options.parameters.get('identifier');
            const content = options.content;
            const serverId = message.guildId;
            const quoteRepository = AppDataSource.getRepository(Quote);
            const cloudinary = v2.config({
                cloud_name: process.env.CLOUDINARY_NAME,
                api_key: process.env.CLOUDINARY_API,
                api_secret: process.env.CLOUDINARY_SECRET,
            });

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

                attachments
                    .filter((attachment) => attachment.contentType?.startsWith('image') && attachment.size <= IMAGE_LIMIT_SIZE)
                    .forEach(async (attachment) => {
                        const uploadResult = await cloudinary.uploader.upload(attachment.url, {
                            folder: BOT_IMAGE_FOLDER,
                            transformation: {
                                quality: CLOUDINARY_IMAGE_QUALITY,
                                fetch_format: CLOUDINARY_IMAGE_FORMAT,
                                width: CLOUDINARY_IMAGE_WIDTH,
                                crop: CLOUDINARY_IMAGE_CROP,
                            },
                        });
                        const quote = new Quote();
                        quote.serverId = serverId;
                        quote.identifier = param;
                        quote.content = uploadResult.secure_url;
                        await quoteRepository.insert(quote);
                    });

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
        parameters: ['identifier'],
        execute: async (message: Message, options: DiscordCommandCustomOptions) => {
            const param = options.parameters.get('identifier');
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
            const replyObject: MessageReplyOptions = quote.content.startsWith('http')
                ? {
                      embeds: [ImageEmbed(quote.content)],
                      components: quotes.length > 1 ? [button] : [],
                  }
                : {
                      content: quote.content,
                      components: quotes.length > 1 ? [button] : [],
                  };

            const msg = await message.reply(replyObject);

            const mc = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30 * 1000 });
            let newQuote: Quote;

            mc.on('collect', async (i) => {
                if (i.user.id !== message.author.id) {
                    await i.reply({ content: '❌ You are not allowed to do this!', ephemeral: true });
                    return;
                }

                await i.deferUpdate();

                newQuote = quotes[Math.floor(Math.random() * quotes.length)];

                if (i.customId === 'random') {
                    const newReplyObject: MessageEditOptions = newQuote.content.startsWith('http')
                        ? {
                              embeds: [ImageEmbed(newQuote.content)],
                              components: quotes.length > 1 ? [button] : [],
                          }
                        : {
                              content: newQuote.content,
                              components: quotes.length > 1 ? [button] : [],
                          };

                    await msg.edit(newReplyObject);
                }

                mc.resetTimer();
            });

            mc.on('end', async () => {
                if (!msg.content) {
                    await msg.edit({ embeds: msg.embeds, components: [] });
                    return;
                }

                await msg.edit({ content: msg.content, components: [] });
                return;
            });

            return;
        },
    },
    {
        name: 'ce',
        description: 'Exchange currency',
        parameters: ['from', 'to', 'amount'],
        execute: async (message: Message, options: DiscordCommandCustomOptions) => {
            let from = options.parameters.get('from');
            let to = options.parameters.get('to');
            const amount = options.parameters.get('amount');

            if (!from || !to || !amount) {
                await message.reply('❌ Invalid parameters');
                return;
            }

            from = from.toLowerCase();
            to = to.toLowerCase();

            axios
                .get<CurrencyResponse>(`${EXCHANGE_API}/${from}.min.json`)
                .then(async (response) => {
                    await SendCurrencyExchangeInfo(message, response.data, from, to, amount);
                })
                .catch(async () => {
                    axios
                        .get<CurrencyResponse>(`${EXCHANGE_API_FALLBACK}/${from}.min.json`)
                        .then(async (response) => {
                            await SendCurrencyExchangeInfo(message, response.data, from, to, amount);
                        })
                        .catch(async () => {
                            await message.reply('❌ Something wrong happened');
                            return;
                        });
                });

            return;
        },
    },
];
