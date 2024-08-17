import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export default [
    {
        data: new SlashCommandBuilder().setName('kfgi').setDescription("Assign Genshin Impact's cookie"),
        async execute(interaction: CommandInteraction) {},
    },
    {
        data: new SlashCommandBuilder().setName('kfhsr').setDescription("Assign Honkai: Star Rail's  cookie"),
        async execute(interaction: CommandInteraction) {},
    },
    {
        data: new SlashCommandBuilder().setName('kfhi').setDescription("Assign Honkai: Impact 3's cookie"),
        async execute(interaction: CommandInteraction) {},
    },
    {
        data: new SlashCommandBuilder().setName('kfzzz').setDescription("Assign Zenless Zone Zero's cookie"),
        async execute(interaction: CommandInteraction) {},
    },
];
