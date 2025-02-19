import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import path from 'path';

type ParseCookieOption = {
    whitelist: string[];
    blacklist: string[];
    separator: string;
};

export class Utils {
    public static GetUrlPath = (url: string): string => {
        return url.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/, '');
    };

    public static ButtonPagination = async (interaction: CommandInteraction, pages: any[], time = 30 * 1000) => {
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

    public static ChunkArray = <T>(array: T[], n: number) => {
        const chunkedArray = [];
        for (let i = 0; i < array.length; i += n) {
            chunkedArray.push(array.slice(i, i + n));
        }
        return chunkedArray;
    };

    public static importFile = async (filePath: string) => {
        return (await import(filePath))?.default;
    };

    public static dateToInt = (date: Date) => {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return parseInt(`${year}${month}${day}`, 10);
    };

    public static parseCookie(cookie: string, options: ParseCookieOption) {
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
    }

    public static getLocalTime() {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60 * 1000;
        const dateLocal = new Date(now.getTime() - offsetMs);
        return dateLocal.toISOString().slice(0, 19).replace(/-/g, '/').replace('T', ' ');
    }

    public static traceCaller(n: number) {
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
    }

    public static AssignGlobal() {
        const log = console.log;
        global.console.log = (...args) => {
            log(`[${Utils.getLocalTime()}]`, Utils.traceCaller(1), ...args);
        };
    }
}
