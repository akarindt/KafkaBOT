import { CommandItem, CurrencyResponse, ParseCookieOption, TfTMetaItem } from '@/interface';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, Message } from 'discord.js';
import path from 'path';
import { BOT_FALLBACK_IMG, ITEM_PER_PAGES, PRIMARY_EMBED_COLOR } from './constant.helper';

export const GetUrlPath = (url: string): string => {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/, '');
};

export const ButtonPagination = async (interaction: CommandInteraction, pages: any[], time = 30 * 1000) => {
    if (!interaction || !pages || !pages.length) throw new Error('Invalid arguments');
    if (pages.length === 1) {
        await interaction.editReply({
            embeds: pages,
            components: [],
        });
        return;
    }

    const prev = new ButtonBuilder().setCustomId('prev').setEmoji('◀️').setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId('next').setEmoji('▶️').setStyle(ButtonStyle.Primary);

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([prev, next]);

    let index = 0;

    const msg = await interaction.editReply({
        embeds: [pages[index]],
        components: [buttons],
    });

    const mc = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time,
    });

    mc.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({ content: '❌ You are not allowed to do this!', ephemeral: true });
            return;
        }

        await i.deferUpdate();

        if (i.customId === 'prev') {
            if (index > 0) {
                index--;
            }
        }

        if (i.customId === 'next') {
            if (index < pages.length - 1) {
                index++;
            }
        }

        if (index === 0) {
            prev.setDisabled(true);
        } else {
            prev.setDisabled(false);
        }

        if (index === pages.length - 1) {
            next.setDisabled(true);
        } else {
            next.setDisabled(false);
        }

        await msg.edit({
            embeds: [pages[index]],
            components: [buttons],
        });

        mc.resetTimer();
    });

    mc.on('end', async () => {
        await msg.edit({
            embeds: [pages[index]],
            components: [],
        });
    });

    return msg;
};

export const ChunkArray = <T>(array: T[], n: number) => {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += n) {
        chunkedArray.push(array.slice(i, i + n));
    }
    return chunkedArray;
};

export const ImportFile = async (filePath: string) => {
    return (await import(filePath))?.default;
};

export const DateToInt = (date: Date) => {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return parseInt(`${year}${month}${day}`, 10);
};

export const ParseCookie = (cookie: string, options: ParseCookieOption) => {
    const { whitelist = [], blacklist = [], separator = ';' } = options;

    const cookiesArray = cookie.split(separator).map((c) => c.trim());
    const cookieMap = Object.fromEntries(
        cookiesArray.map((c) => {
            const [key, value] = c.split('=');
            return [key, value];
        })
    );

    if (whitelist.length !== 0) {
        const filteredCookiesArray = Object.keys(cookieMap)
            .filter((key) => whitelist.includes(key))
            .map((key) => `${key}=${cookieMap[key]}`);

        return filteredCookiesArray.join(`${separator} `);
    }
    if (blacklist.length !== 0) {
        const filteredCookiesArray = Object.keys(cookieMap)
            .filter((key) => !blacklist.includes(key))
            .map((key) => `${key}=${cookieMap[key]}`);

        return filteredCookiesArray.join(`${separator} `);
    }

    return cookie;
};

export const GetLocalTime = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const dateLocal = new Date(now.getTime() - offsetMs);
    return dateLocal.toISOString().slice(0, 19).replace(/-/g, '/').replace('T', ' ');
};

export const TraceCaller = (n: number) => {
    if (isNaN(n) || n < 0) n = 1;
    n += 1;
    let s = new Error().stack;

    if (!s) return '[Dependencies]';

    let a = s.indexOf('\n', 5);

    while (n--) {
        a = s.indexOf('\n', a + 1);
        if (a < 0) {
            a = s.lastIndexOf('\n', s.length);
            break;
        }
    }
    var b = s.indexOf('\n', a + 1);
    if (b < 0) b = s.length;
    a = Math.max(s.lastIndexOf(' ', b), s.lastIndexOf('/', b));
    b = s.lastIndexOf(':', b);
    s = s.substring(a + 1, b);
    return `[${path.basename(s)}]`;
};

export const AssignGlobal = () => {
    const log = console.log;
    global.console.log = (...args) => {
        log(`[${GetLocalTime()}]`, TraceCaller(1), ...args);
    };
};

export const ImageEmbed = (imageUrl: string) => {
    return new EmbedBuilder().setImage(imageUrl);
};

export const SendCurrencyExchangeInfo = async (message: Message, response: CurrencyResponse, from: string, to: string, amount: string) => {
    const data = response;
    const date = data.date as string;
    const rate = Number((data[from] as { [key: string]: number })[to]);
    const result = parseFloat(amount) * rate;

    from = from.toUpperCase();
    to = to.toUpperCase();

    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const formatedFrom = new Intl.NumberFormat(locale, { style: 'currency', currency: from }).format(parseFloat(amount));
    const formatedTo = new Intl.NumberFormat(locale, { style: 'currency', currency: to }).format(result);

    const embed = new EmbedBuilder()
        .setTitle(`Currency exchange: ${from} -> ${to}`)
        .setColor(PRIMARY_EMBED_COLOR)
        .setDescription(`From: ${from}\nTo: ${to}\nAmount: ${formatedFrom}`)
        .addFields({
            name: 'Result',
            value: `${formatedTo}`,
        })
        .setFooter({ text: `KafkaBOT - Currency exchange - ${date}`, iconURL: message.client.user.avatarURL() || BOT_FALLBACK_IMG });

    await message.reply({ embeds: [embed] });
    return;
};

export const TftListEmbed = (interaction: CommandInteraction, tftMetaList: TfTMetaItem[]) => {
    if (tftMetaList.length <= 0) return [];
    if (tftMetaList.length <= ITEM_PER_PAGES) {
        return [
            new EmbedBuilder()
                .setColor(PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                    iconURL: interaction.user.avatarURL() || BOT_FALLBACK_IMG,
                })
                .setTitle('TFT current meta list')
                .setDescription(
                    tftMetaList
                        .map((tftItem) => {
                            return (
                                `- **[${tftItem.title}](${tftItem.redirectUrl})**: ` +
                                `Avg: **${tftItem.avgPlace}** - 1st: **${tftItem.top1Rate}** - Top 4: **${tftItem.top4Rate}** - ` +
                                `Cost: **${tftItem.totalCost}**`
                            );
                        })
                        .join('\n')
                )
                .setTimestamp()
                .setFooter({ text: 'KafkaBOT - Misc', iconURL: interaction.client.user.avatarURL() || BOT_FALLBACK_IMG }),
        ];
    }

    const embeds = ChunkArray(tftMetaList, ITEM_PER_PAGES);
    return embeds.map((tftList) => {
        return new EmbedBuilder()
            .setColor(PRIMARY_EMBED_COLOR)
            .setAuthor({
                name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL() || BOT_FALLBACK_IMG,
            })
            .setTitle('TFT current meta list')
            .setDescription(
                tftList
                    .map((tftItem) => {
                        return (
                            `- **[${tftItem.title}](${tftItem.redirectUrl})**: ` +
                            `Avg: **${tftItem.avgPlace}** - 1st: **${tftItem.top1Rate}** - Top 4: **${tftItem.top4Rate}** - ` +
                            `Cost: **${tftItem.totalCost}**`
                        );
                    })
                    .join('\n')
            )
            .setTimestamp()
            .setFooter({ text: 'KafkaBOT - Misc', iconURL: interaction.client.user.avatarURL() || BOT_FALLBACK_IMG });
    });
};

export const ListCommands = (interaction: CommandInteraction, commands: CommandItem[]) => {
    if (commands.length <= 0) return [];
    if (commands.length <= ITEM_PER_PAGES) {
        return [
            new EmbedBuilder()
                .setColor(PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                    iconURL: interaction.user.avatarURL() || BOT_FALLBACK_IMG,
                })
                .setTitle('Command list')
                .setDescription(
                    commands
                        .map((command) => {
                            return `- **${command.commandName}  ${command.parameters
                                .map((parameter) => {
                                    return `{${parameter}}`;
                                })
                                .join('-')}**: ${command.description}`;
                        })
                        .join('\n')
                )
                .setTimestamp()
                .setFooter({ text: 'KafkaBOT - Misc', iconURL: interaction.client.user.avatarURL() || BOT_FALLBACK_IMG }),
        ];
    }

    const embeds = ChunkArray(commands, ITEM_PER_PAGES);
    return embeds.map((commandList) => {
        return new EmbedBuilder()
            .setColor(PRIMARY_EMBED_COLOR)
            .setAuthor({
                name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL() || BOT_FALLBACK_IMG,
            })
            .setTitle('Command list')
            .setDescription(
                commandList
                    .map((command) => {
                        return `- **${command.commandName}  ${command.parameters
                            .map((parameter) => {
                                return `{${parameter}}`;
                            })
                            .join('-')}**: ${command.description}`;
                    })
                    .join('\n')
            )
            .setTimestamp()
            .setFooter({ text: 'KafkaBOT - Misc', iconURL: interaction.client.user.avatarURL() || BOT_FALLBACK_IMG });
    });
};
