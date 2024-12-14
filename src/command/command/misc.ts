import { CommandInteraction, EmbedBuilder, PollData, PollLayoutType, SlashCommandBuilder, TextChannel, userMention } from 'discord.js';
import { Utils } from '@/helper/util';
import { Misc } from '@/helper/constant';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import axios from 'axios';

type CommandItem = {
    commandName: string;
    description: string;
    parameters: string[];
};

type TfTMetaItem = {
    id: string | null | undefined;
    title: string | null | undefined;
    tag: string | null | undefined;
    totalCost: string | null | undefined;
    avgPlace: string | null | undefined;
    top1Rate: string | null | undefined;
    top4Rate: string | null | undefined;
    pickRate: string | null | undefined;
    redirectUrl: string | null | undefined;
    sort: number;
};

type MemeResponse = {
    postLink: string;
    subreddit: string;
    title: string;
    url: string;
    nsfw: boolean;
    spoiler: boolean;
    author: string;
    ups: number;
    preview: string[];
};

const tftListEmbed = (interaction: CommandInteraction, tftMetaList: TfTMetaItem[]) => {
    if (tftMetaList.length <= 0) return [];
    if (tftMetaList.length <= Misc.ITEM_PER_PAGES) {
        return [
            new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                    iconURL: interaction.user.avatarURL() || '',
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
                .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' }),
        ];
    }

    const embeds = Utils.ChunkArray(tftMetaList, Misc.ITEM_PER_PAGES);
    return embeds.map((tftList) => {
        return new EmbedBuilder()
            .setColor(Misc.PRIMARY_EMBED_COLOR)
            .setAuthor({
                name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL() || '',
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
            .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' });
    });
};

const listCommands = (interaction: CommandInteraction, commands: CommandItem[]) => {
    if (commands.length <= 0) return [];
    if (commands.length <= Misc.ITEM_PER_PAGES) {
        return [
            new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                    iconURL: interaction.user.avatarURL() || '',
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
                .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' }),
        ];
    }

    const embeds = Utils.ChunkArray(commands, Misc.ITEM_PER_PAGES);
    return embeds.map((commandList) => {
        return new EmbedBuilder()
            .setColor(Misc.PRIMARY_EMBED_COLOR)
            .setAuthor({
                name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL() || '',
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
            .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' });
    });
};

export default [
    {
        data: new SlashCommandBuilder().setName('kfping').setDescription('Replies with Pong!'),
        execute: async (interaction: CommandInteraction) => {
            const delay = Math.abs(Date.now() - interaction.createdTimestamp);
            await interaction.reply(`Delay: ${delay}ms - Pong!`);
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfcommands').setDescription("Get KafkaBOT's command list"),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const pathFile = path.join(process.cwd(), '/extra/command-list.json');
            const stringify = await fs.promises.readFile(pathFile, 'utf-8');
            const data: CommandItem[] = JSON.parse(stringify);
            await Utils.ButtonPagination(interaction, listCommands(interaction, data));
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('kfpoll')
            .setDescription('Create a poll')
            .addStringOption((options) => options.setName('question').setDescription("Poll's question").setRequired(true))
            .addBooleanOption((options) => options.setName('multi').setDescription('Allow multiple selection').setRequired(true))
            .addNumberOption((options) => options.setName('duration').setDescription("Poll's duration (hours)").setRequired(true))
            .addStringOption((options) => options.setName('polls').setDescription("Polls, seperated by '|||'").setRequired(true)),
        execute: async (interaction: CommandInteraction) => {
            const question = interaction.options.get('question', true);
            const multi = interaction.options.get('multi', true);
            const duration = interaction.options.get('duration', true);
            const polls = interaction.options.get('polls', true);

            if (!interaction.channel) {
                await interaction.reply('❌ Channel not found');
                return;
            }

            if (!question.value || !polls.value || typeof multi.value == 'undefined' || !duration.value) {
                await (interaction.channel as TextChannel).send('❌ Invalid parameters');
                return;
            }

            const poll: PollData = {
                question: { text: question.value as string },
                answers: (polls.value as string).split('|||').map((p) => {
                    return { text: p };
                }),
                allowMultiselect: multi.value as boolean,
                duration: duration.value as unknown as number,
                layoutType: PollLayoutType.Default,
            };

            await (interaction.channel as TextChannel).send({ poll: poll });
            return;
        },
    },
    {
        data: new SlashCommandBuilder().setName('kftft').setDescription('Get current tft meta'),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const url = 'https://tft.op.gg/meta-trends/comps';

            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });
            const page = await browser.newPage();

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
            });

            const wrappers = await page.$$('li[id]');
            let comps: TfTMetaItem[] = [];
            await Promise.all(
                wrappers.map(async (wrapper, index) => {
                    const sort = index;
                    const id = await wrapper.evaluate((node) => node.getAttribute('id'));
                    const title = await (await wrapper.$('.basic-info .title strong'))?.evaluate((node) => node.textContent);
                    const tag = await (await wrapper.$('.basic-info .title span'))?.evaluate((node) => node.textContent);
                    const totalCost = await (await wrapper.$('.basic-info .gold span'))?.evaluate((node) => node.textContent);
                    const avgPlace = await (await wrapper.$('.rate-info dl:nth-child(1) dd'))?.evaluate((node) => node.textContent);
                    const top1Rate = await (await wrapper.$('.rate-info dl:nth-child(2) dd'))?.evaluate((node) => node.textContent);
                    const top4Rate = await (await wrapper.$('.rate-info dl:nth-child(3) dd'))?.evaluate((node) => node.textContent);
                    const pickRate = await (await wrapper.$('.rate-info dl:nth-child(4) dd'))?.evaluate((node) => node.textContent);
                    const redirectUrl = `https://tft.op.gg/meta-trends/comps/${id}?view=newbie`;
                    comps.push({ title, tag, totalCost, avgPlace, top1Rate, top4Rate, pickRate, id, redirectUrl, sort });
                })
            );

            comps = comps.sort((a, b) => a.sort - b.sort);
            const pages = await browser.pages();
            for (let i = 0; i < pages.length; i++) {
                await pages[i].close();
            }
            await browser.close()
            await Utils.ButtonPagination(interaction, tftListEmbed(interaction, comps));
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('kfud')
            .setDescription('Search this word on Urban Dictionary')
            .addStringOption((options) => options.setName('term').setDescription('Give me a term').setRequired(true)),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const option = interaction.options.get('term', true);
            if (!option.value) {
                await interaction.followUp('❌ Invalid parameter');
                return;
            }

            const term = option.value as string;
            const url = `https://www.urbandictionary.com/define.php?term=${term}`;

            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });;
            const page = await browser.newPage();

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
            });

            const definition = await page.$('div.definition');
            if (!definition) {
                await interaction.followUp('❌ This term has no definition');
                return;
            }

            const meaning = await (await definition.$('.meaning'))?.evaluate((node) => node.textContent);
            const contributor = await (await definition.$('.contributor'))?.evaluate((node) => node.textContent);
            const authorUrl = await (await definition.$('.contributor a'))?.evaluate((node) => node.getAttribute('href'));

            const pages = await browser.pages();
            for (let i = 0; i < pages.length; i++) {
                await pages[i].close();
            }
            await browser.close()

            const embed = new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setDescription(
                    `**Term: [${term}](${url})** \n **Definition: ** ${meaning} \n  - [${contributor}](https://www.urbandictionary.com${authorUrl})`
                )
                .setTimestamp()
                .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' });
            await interaction.followUp({ embeds: [embed] });
            return;
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfmeme').setDescription('Summon a random meme at will'),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const api = 'https://meme-api.com/gimme';
            const subreddits = [
                'dankmemes',
                'historymemes',
                'wordington',
                'nwordington',
                'Ikeafreshballs',
                'shid_and_camed',
                'rodentintercourse',
                'doodoofard',
                '21stCenturyHumour',
                'comedyepilepsy',
            ];

            const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];

            const response = await axios.get(`${api}/${subreddit}`);

            const data = response.data as MemeResponse;
            const embed = new EmbedBuilder()
                .setTitle(data.title.toLocaleUpperCase())
                .setURL(data.postLink)
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setImage(data.url)
                .setTimestamp()
                .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' });

            await interaction.followUp({ embeds: [embed] });
            return;
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfinfo').setDescription("Get user's info"),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const user = interaction.user;
            const guild = interaction.guild;
            const clientStatus = guild?.members.cache.get(user.id)?.presence?.clientStatus;
            let statusText = '';

            const statusObj = {
                dnd: 'Do Not Disturb',
                online: 'Online',
                idle: 'Idle',
            };

            if (clientStatus?.desktop) {
                statusText = `**Desktop: ** ${statusObj[clientStatus.desktop]}`;
            } else if (clientStatus?.mobile) {
                statusText = `**Mobile: ** ${statusObj[clientStatus.mobile]}`;
            } else if (clientStatus?.web) {
                statusText = `**Web: ** ${statusObj[clientStatus.web]}`;
            } else {
                statusText = 'Not online';
            }

            const embed = new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL() || '',
                })
                .setDescription(userMention(interaction.user.id))
                .setThumbnail(interaction.user.avatarURL())
                .setFields(
                    { name: 'Information', value: `**Bot: ** ${user.bot ? 'Yes' : 'No'} \n **ID: ** \`${user.id}\``, inline: true },
                    {
                        name: 'Joined',
                        value: `**Discord: ** ||${user.createdAt}|| \n **Guild: ** ||${guild?.members.cache.get(user.id)?.joinedAt}|| `,
                        inline: true,
                    },
                    { name: '\n\r', value: '\n\r' },
                    {
                        name: 'Guild Specific',
                        value: `**Owner: ** ${guild?.ownerId === user.id ? 'Yes' : 'No'}  \n **Roles (${
                            guild?.members.cache.get(user.id)?.roles.cache.size
                        }): ** ${guild?.members.cache
                            .get(user.id)
                            ?.roles.cache.map((role) => {
                                return `\` ${role.name} \``;
                            })
                            .join(', ')}`,
                    },
                    { name: '\n\r', value: '\n\r' },
                    { name: 'Status', value: statusText },
                    { name: '\n\r', value: '\n\r' },
                    {
                        name: 'Urls',
                        value: `**Banner URL: ** ${user.bannerURL() ? `[Link](${user.bannerURL()})` : 'Not available'} \n **Avatar URL: ** ${
                            user.avatarURL() ? `[Link](${user.avatarURL()})` : 'Not available'
                        }`,
                    }
                );

            await interaction.followUp({ embeds: [embed] });
            return;
        },
    },
];
