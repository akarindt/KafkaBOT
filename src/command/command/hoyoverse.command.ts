import Hoyoverse from '@entity/hoyoverse.entity';
import { BOT_FALLBACK_IMG, PRIMARY_EMBED_COLOR } from '@helper/constant.helper';
import { AppDataSource } from '@helper/datasource.helper';
import { DateToInt } from '@helper/util.helper';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export default [
    {
        data: new SlashCommandBuilder()
            .setName('kfhoyo')
            .setDescription('Assign your Hoyolab cookie')
            .addStringOption((options) => options.setName('cookie').setDescription('Your Hoyolab cookie').setRequired(true)),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const option = interaction.options.get('cookie', true);
            if (!option.value) {
                await interaction.followUp('❌ Invalid parameters');
                return;
            }

            const cookie = option.value as string;
            const userDiscordId = interaction.user.id;
            const repository = AppDataSource.getRepository(Hoyoverse);

            try {
                const entity = new Hoyoverse();
                entity.userDiscordId = userDiscordId;
                entity.cookie = cookie;
                entity.lastUpdated = DateToInt(new Date());
                await repository.insert(entity);
                await interaction.followUp({ content: '✅ Assign successfully !', ephemeral: true });
                return;
            } catch (error) {
                await interaction.followUp('❌ Something wrong happened');
                return;
            }
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('kfhyupdate')
            .setDescription('Update your Hoyolab cookie')
            .addStringOption((options) => options.setName('cookie').setDescription('Your Hoyolab cookie').setRequired(true)),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            const option = interaction.options.get('cookie', true);
            if (!option.value) {
                await interaction.followUp('❌ Invalid parameters');
                return;
            }

            const cookie = option.value as string;
            const userDiscordId = interaction.user.id;
            const repository = AppDataSource.getRepository(Hoyoverse);

            try {
                const entity = await repository.findOne({ where: { userDiscordId } });
                if (!entity) {
                    await interaction.followUp('❌ You have not assigned your cookie yet');
                    return;
                }

                entity.cookie = cookie;
                entity.lastUpdated = DateToInt(new Date());
                await repository.save(entity);
                await interaction.followUp({ content: '✅ Update successfully !', ephemeral: true });
                return;
            } catch (error) {
                await interaction.followUp('❌ Something wrong happened');
                return;
            }
        },
    },
    {
        data: new SlashCommandBuilder().setName('kfhoyohelp').setDescription('Find out how to get your Hoyolab cookie'),
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();

            let message = `- Go to [HoYoLAB](https://www.hoyolab.com/) (<https://www.hoyolab.com/>) and log in. (Highly recommend using incognito mode) \n`;
            message += `- Go to your profile page. \n`;
            message += `- Open the developer tools (F12 or Ctrl+Shift+I). \n`;
            message += `- Go to the "Network" tab. \n`;
            message += `- Click on the "Preserve Log" / "Persist Logs" button. (On FireFox this is under the gear icon in the top right of the network tab). \n`;
            message += `- Refresh the page. \n`;
            message += `- Click on the getGameRecordCard request where the method is "GET" (it should be named "getGameRecordCard" with your HoYoLab UID). \n`;
            message += `- Scroll down to the "Request Headers" section. \n`;
            message += `- Find the "cookie" header. \n`;
            message += `- Copy the value of the "cookie" header. \n`;

            const embed = new EmbedBuilder()
                .setTitle('Here is how to get your Hoyolab cookie')
                .setColor(PRIMARY_EMBED_COLOR)
                .setDescription(message)
                .setImage('https://res.cloudinary.com/dbivuiucl/image/upload/v1739938838/kafkaBOT/how_to_get_wml3jj.png')
                .setTimestamp()
                .setFooter({ text: 'KafkaBOT - How to get Hoyolab cookies', iconURL: interaction.client.user.avatarURL() || BOT_FALLBACK_IMG });

            await interaction.followUp({ embeds: [embed], ephemeral: true });
            return;
        },
    },
];
