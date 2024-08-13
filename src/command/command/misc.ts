import { CommandInteraction, EmbedBuilder, PollData, PollLayoutType, SlashCommandBuilder } from 'discord.js';
import { Utils } from '@/helper/util';
import { Misc } from '@/helper/constant';
import path from 'path';
import fs from 'fs';

type CommandItem = {
    commandName: string;
    description: string;
    parameters: string[];
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
    return embeds.map(() => {
        return new EmbedBuilder()
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
            .setFooter({ text: 'Misc', iconURL: interaction.client.user.avatarURL() || '' });
    });
};

export default [
    {
        data: new SlashCommandBuilder().setName('kfping').setDescription('Replies with Pong!'),
        async execute(interaction: CommandInteraction) {
            const delay = Math.abs(Date.now() - interaction.createdTimestamp);
            await interaction.reply(`Delay: ${delay}ms - Pong!`);
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfcommands').setDescription("Get KafkaBOT's command list"),
        async execute(interaction: CommandInteraction) {
            const pathFile = path.resolve(__dirname, '../../../extra/command-list.json');
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
        async execute(interaction: CommandInteraction) {
            const question = interaction.options.get('question', true);
            const multi = interaction.options.get('multi', true);
            const duration = interaction.options.get('duration', true);
            const polls = interaction.options.get('polls', true);

            if (!interaction.channel) {
                await interaction.reply('❌ Channel not found');
                return;
            }

            if (!question.value || !polls.value || typeof multi.value == 'undefined' || !duration.value) {
                await interaction.channel.send('❌ Invalid parameters');
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

            await interaction.channel.send({ poll: poll });
            return;
        },
    },
];
