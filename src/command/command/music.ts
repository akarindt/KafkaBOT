import { Playlist, useMainPlayer } from 'discord-player';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export default [
    {
        data: new SlashCommandBuilder()
            .setName('play')
            .setDescription('Play a song')
            .addStringOption((options) => options.setName('query').setDescription('The song you want to play').setRequired(true)),
        async execute(interaction: CommandInteraction) {
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
                await interaction.followUp(`**${track.cleanTitle}** enqueued!`);
                return;
            } catch (e) {
                await interaction.followUp(`Something went wrong: ${e}`);
                return;
            }
        },
    },
    {
        data: new SlashCommandBuilder().setName('skip').setDescription('Skip to the current song'),
        async execute(interaction: CommandInteraction) {},
    },
    {
        data: new SlashCommandBuilder().setName('queue').setDescription('See the queue'),
        async execute(interaction: CommandInteraction) {},
    },
    {
        data: new SlashCommandBuilder().setName('stop').setDescription('Stop the player'),
        async execute(interaction: CommandInteraction) {},
    },
];
