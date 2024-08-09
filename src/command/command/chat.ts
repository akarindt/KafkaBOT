import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Hercai, QuestionData, DrawImageData } from "hercai";

const herc = new Hercai();

export default [
    {
        data: new SlashCommandBuilder()
            .setName('chat')
            .setDescription('Chat with AI')
            .addStringOption(options => 
                options.setName('input').setDescription('Ask me anything...').setRequired(true)
            ),
        async execute(interaction: CommandInteraction) {
            
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('draw')
            .setDescription("Ask AI to draw a image")
            .addStringOption(options => 
                options.setName('input').setDescription('Give me an idea...').setRequired(true)
            ),
        async execute(interaction: CommandInteraction) {

        }
    }
];
