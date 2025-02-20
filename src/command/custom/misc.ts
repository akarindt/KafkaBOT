import Quote from '@/entity/quote';
import { Misc } from '@/helper/constant';
import { AppDataSource } from '@/helper/datasource';
import { CustomOptions } from '@/infrastructure/client';
import CloudinaryClient from '@/infrastructure/cloudinary';
import axios from 'axios';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Message,
    MessageEditOptions,
    MessageReplyOptions,
} from 'discord.js';

interface CurrencyResponse {
    [key: string]:
        | {
              [key: string]: number;
          }
        | string;
}

const imageEmbed = (imageUrl: string) => {
    return new EmbedBuilder().setImage(imageUrl);
};

const sendCurrencyExchangeInfo = async (message: Message, response: CurrencyResponse, from: string, to: string, amount: string) => {
    const data = response;
    const date = data.date as string;
    const rate = Number((data[from] as { [key: string]: number })[to]);
    const result = parseFloat(amount) * rate;

    from = from.toUpperCase();
    to = to.toUpperCase();

    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const formatedFrom = new Intl.NumberFormat(locale, {style: 'currency', currency: from}).format(parseFloat(amount));
    const formatedTo = new Intl.NumberFormat(locale, {style: 'currency', currency: to}).format(result);

    const embed = new EmbedBuilder()
        .setTitle(`Currency exchange: ${from} -> ${to}`)
        .setColor(Misc.PRIMARY_EMBED_COLOR)
        .setDescription(`From: ${from}\nTo: ${to}\nAmount: ${formatedFrom}`)
        .addFields({
            name: 'Result',
            value: `${formatedTo}`,
        })
        .setFooter({ text: `KafkaBOT - Currency exchange - ${date}`, iconURL: message.client.user.avatarURL() || Misc.BOT_FALLBACK_IMG });

    await message.reply({ embeds: [embed] });
    return;
};

export default [
    {
        name: '%',
        description: 'Save quote',
        parameters: ['identifier'],
        execute: async (message: Message, options: CustomOptions) => {
            const param = options.parameters.get('identifier');
            const content = options.content;
            const serverId = message.guildId;
            const quoteRepository = AppDataSource.getRepository(Quote);
            const cloudinary = new CloudinaryClient();

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
                    .filter((attachment) => attachment.contentType?.startsWith('image') && attachment.size <= Misc.IMAGE_LIMIT_SIZE)
                    .forEach(async (attachment) => {
                        const uploadResult = await cloudinary.uploader.upload(attachment.url, {
                            folder: Misc.BOT_IMAGE_FOLDER,
                            transformation: {
                                quality: Misc.CLOUDINARY_IMAGE_QUALITY,
                                fetch_format: Misc.CLOUDINARY_IMAGE_FORMAT,
                                width: Misc.CLOUDINARY_IMAGE_WIDTH,
                                crop: Misc.CLOUDINARY_IMAGE_CROP,
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
        execute: async (message: Message, options: CustomOptions) => {
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
            let msg: Message;
            const replyObject: MessageReplyOptions = quote.content.startsWith('http')
                ? {
                      embeds: [imageEmbed(quote.content)],
                      components: quotes.length > 1 ? [button] : [],
                  }
                : {
                      content: quote.content,
                      components: quotes.length > 1 ? [button] : [],
                  };

            msg = await message.reply(replyObject);

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
                              embeds: [imageEmbed(newQuote.content)],
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
        execute: async (message: Message, options: CustomOptions) => {
            let from = options.parameters.get('from');
            let to = options.parameters.get('to');
            let amount = options.parameters.get('amount');

            if (!from || !to || !amount) {
                await message.reply('❌ Invalid parameters');
                return;
            }

            from = from.toLowerCase();
            to = to.toLowerCase();

            axios
                .get<CurrencyResponse>(`${Misc.EXCHANGE_API}/${from}.min.json`)
                .then(async (response) => {
                    await sendCurrencyExchangeInfo(message, response.data, from, to, amount);
                })
                .catch(async (error) => {
                    axios
                        .get<CurrencyResponse>(`${Misc.EXCHANGE_API_FALLBACK}/${from}.min.json`)
                        .then(async (response) => {
                            await sendCurrencyExchangeInfo(message, response.data, from, to, amount);
                        })
                        .catch(async (error) => {
                            await message.reply('❌ Something wrong happened');
                            return;
                        });
                });

            return;
        },
    },
];
