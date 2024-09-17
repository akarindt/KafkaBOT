import { Misc } from '@/helper/constant';
import { Utils } from '@/helper/util';
import { Track, useMainPlayer } from 'discord-player';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const listTrackEmbed = (interaction: CommandInteraction, listTracks: Track[]) => {
    if (listTracks.length <= 0) return [];
    if (listTracks.length <= Misc.ITEM_PER_PAGES) {
        return [
            new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                    iconURL: interaction.user.avatarURL() || '',
                })
                .setTitle('List tracks')
                .setDescription(
                    listTracks
                        .map((track) => {
                            return `- **[${track.cleanTitle}](${track.url})** - By: **${track.author}** - Duration: **${track.duration}**`;
                        })
                        .join('\n')
                )
                .setTimestamp()
                .setFooter({ text: 'Music', iconURL: interaction.client.user.avatarURL() || '' }),
        ];
    }

    const embeds = Utils.ChunkArray(listTracks, Misc.ITEM_PER_PAGES);
    return embeds.map((tracks) => {
        return new EmbedBuilder()
            .setColor(Misc.PRIMARY_EMBED_COLOR)
            .setAuthor({
                name: `${interaction.user.displayName} - ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL() || '',
            })
            .setTitle('List tracks')
            .setDescription(
                tracks
                    .map((track) => {
                        return `- **[${track.cleanTitle}](${track.url})** - Duration: ${track.author}`;
                    })
                    .join('\n')
            )
            .setTimestamp()
            .setFooter({ text: 'Music', iconURL: interaction.client.user.avatarURL() || '' });
    });
};

export default [
    {
        data: new SlashCommandBuilder()
            .setName('kfplay')
            .setDescription('Play a song')
            .addStringOption((options) => options.setName('query').setDescription('The song you want to play').setRequired(true)),
        execute: async (interaction: CommandInteraction) => {
            const player = useMainPlayer();

            if (!interaction.guildId) {
                await interaction.reply('❌ Guild ID not found!');
                return;
            }

            const guild = interaction.client.guilds.cache.get(interaction.guildId);

            if (!guild) {
                await interaction.reply('❌ Guild not found!');
                return;
            }

            if (!interaction.member) {
                await interaction.reply('❌ Member not found');
                return;
            }

            const member = guild.members.cache.get(interaction.member.user.id);
            if (!member) {
                await interaction.reply('❌ Cannot get member');
                return;
            }

            const voiceChannel = member.voice.channel;

            if (!voiceChannel) {
                await interaction.reply('❌ You are not connected to a voice channel!');
                return;
            }

            const query = interaction.options.get('query', true);
            await interaction.deferReply();
            try {
                const { track } = await player.play(voiceChannel, query.value as string, {
                    nodeOptions: {
                        metadata: interaction,
                    },
                });
                await interaction.followUp(`✅ **${track.cleanTitle}** enqueued!`);
                return;
            } catch (e) {
                await interaction.followUp(`❌ Something went wrong: ${e}`);
                return;
            }
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfskip').setDescription('Skip to the current song'),
        execute: async (interaction: CommandInteraction) => {
            const player = useMainPlayer();
            await interaction.deferReply();

            if (!interaction.guildId) {
                await interaction.reply('❌ Guild ID not found!');
                return;
            }

            const queue = player.queues.cache.get(interaction.guildId);

            if (!queue) {
                await interaction.followUp('❌ Queue not found!');
                return;
            }

            const currentTrack = queue.currentTrack;

            if (!currentTrack) {
                await interaction.followUp('❌ No music is being played!');
                return;
            }

            const success = queue.node.skip();
            await interaction.followUp({
                content: success ? `✅ Skipped **[${currentTrack?.cleanTitle}](${currentTrack?.url})**!` : '❌ Something went wrong!',
            });
            return;
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfqueue').setDescription('See the queue'),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const player = useMainPlayer();
            const queue = player.queues.cache.get(interaction.guildId || '');
            if (!queue) {
                await interaction.followUp('❌ Queue not found!');
                return;
            }

            const tracks = queue.tracks;
            await Utils.ButtonPagination(interaction, listTrackEmbed(interaction, tracks.data));
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfstop').setDescription('Stop the player'),
        execute: async (interaction: CommandInteraction) => {
            const player = useMainPlayer();
            await interaction.deferReply();

            if (!interaction.guildId) {
                await interaction.followUp('❌ Guild ID not found!');
                return;
            }

            const queue = player.queues.cache.get(interaction.guildId);

            if (!queue) {
                await interaction.followUp('❌ Queue not found!');
                return;
            }

            queue.delete();
            await interaction.followUp({ content: '🛑 Stopped the player!' });
            return;
        },
    },
];
