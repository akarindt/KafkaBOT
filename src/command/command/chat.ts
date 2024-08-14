import { Misc } from '@/helper/constant';
import { ChannelType, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Hercai } from 'hercai';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from '@/helper/datasource';
import NSFWKeyword from '@/entity/nsfwKeyword';


export default [
    {
        data: new SlashCommandBuilder()
            .setName('kfchat')
            .setDescription('Chat with AI')
            .addStringOption((options) => options.setName('question').setDescription('Ask me anything...').setRequired(true)),
        async execute(interaction: CommandInteraction) {
            await interaction.deferReply();
            const herc = new Hercai();
            const question = interaction.options.get('question', true);
            if (!question.value) {
                await interaction.followUp('❌ Invalid input');
                return;
            }

            const response = await herc.question({ model: 'v3', content: question.value as string });
            const embed = new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setDescription(`** ${interaction.user.displayName} asked **: ${response.content} \n ** KafkaBOT **: ${response.reply}`)
                .setTimestamp()
                .setFooter({ text: 'KafkaBOT - Chat with AI', iconURL: interaction.client.user.avatarURL() || '' });

            await interaction.followUp({ embeds: [embed] });
            return;
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('kfdraw')
            .setDescription('Ask AI to draw a image')
            .addStringOption((options) => options.setName('idea').setDescription('Give me an idea...').setRequired(true)),
        async execute(interaction: CommandInteraction) {
            await interaction.deferReply();

            const NSFWKeywordRepository = AppDataSource.getRepository(NSFWKeyword);
            const totalKeyword = await NSFWKeywordRepository.count();
            if (totalKeyword <= 0) {
                console.log(`[INFO] Empty list, begin to add list of nsfw keywords`);
                const fileContent = await fs.promises.readFile(path.join(__dirname, '../../../extra/nsfw-keywords/keywords.txt'), 'utf-8');
                const data = fileContent.split(/\r?\n/);
                const entities: NSFWKeyword[] = [];
                for (const value of data) {
                    const entity = new NSFWKeyword();
                    entity.keyword = value;
                    entities.push(entity);
                }

                await NSFWKeywordRepository.insert(entities);
                console.log(`[INFO] List of nsfw keywords added successfully`);
            }

            const idea = interaction.options.get('idea', true);
            if (!idea.value) {
                await interaction.followUp('❌ Invalid input');
                return;
            }

            const value = idea.value as string;
            const check =
                (await NSFWKeywordRepository.createQueryBuilder('nsfw')
                    .where('nsfw.keyword IN (:...keywords)', {
                        keywords: value.split(' '),
                    })
                    .getCount()) > 0;

            if (check && interaction.channel?.type === ChannelType.GuildText && !interaction.channel.nsfw) {
                await interaction.followUp('❌ This is nsfw content, please use it in nsfw channel');
                return;
            }

            const herc = new Hercai();
            const response = await herc.drawImage({
                model: 'shonin',
                prompt: value,
                negative_prompt: Misc.NEGATIVE_PROMPTS.join(','),
            });

            const embed = new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setDescription(
                    `** ${interaction.user.displayName}'s idea**: ${response.prompt} 
                    \n** KafkaBOT's response **: Here is your [${response.prompt}](${response.url})`
                )
                .setImage(response.url)
                .setTimestamp()
                .setFooter({ text: 'KafkaBOT - Chat with AI', iconURL: interaction.client.user.avatarURL() || '' });

            await interaction.followUp({ embeds: [embed] });
            return;
        },
    },
];
