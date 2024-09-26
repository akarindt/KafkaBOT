import Hoyoverse from '@/entity/hoyoverse';
import { AppDataSource } from '@/helper/datasource';
import { BotClient } from '@/infrastructure/client';
import schedule from 'node-schedule';
import { HoyoverseClient, HoyoverseConstantName, UpdateHoyolabCookieResponse } from '@/infrastructure/hoyoverse';
import { Utils } from '@/helper/util';
import axios from 'axios';
import { Hoyoverse as HoyoConstant, Misc } from '@/helper/constant';
import { EmbedBuilder } from 'discord.js';

const sendDiscord = (client: BotClient, gameName: HoyoverseConstantName, data: Hoyoverse[]) => {
    const game = new HoyoverseClient(gameName, data);

    game.CheckAndExecute()
        .then(async (successes) => {
            for (const success of successes) {
                const embed = new EmbedBuilder()
                    .setColor(Misc.PRIMARY_EMBED_COLOR)
                    .setTitle(`${success.assets.gameName} Daily Check-In`)
                    .setAuthor({
                        name: `${success.account.uid} - ${success.account.nickname}`,
                        iconURL: success.assets.icon,
                    })
                    .setFields(
                        {
                            name: 'Nickname',
                            value: success.account.nickname,
                            inline: true,
                        },
                        {
                            name: 'UID',
                            value: success.account.uid,
                            inline: true,
                        },
                        {
                            name: 'Rank',
                            value: success.account.rank.toString(),
                            inline: true,
                        },
                        {
                            name: 'Region',
                            value: success.account.region,
                            inline: true,
                        },
                        {
                            name: 'Result',
                            value: success.result,
                            inline: false,
                        },
                    )
                    .setTimestamp()
                    .setFooter({
                        text: `${success.assets.gameName} Daily Check-In`,
                        iconURL: client.user?.avatarURL() || '',
                    });

                await client.users.send(success.userDiscordId, { embeds: [embed] });
            }
        })
        .catch((e) => {
            console.log(`[ERROR] An error occurred during checkin: ${e}`);
        });
};

export const StartHoyolabCheckInJob = async (client: BotClient) => {
    const hoyoverseRepository = AppDataSource.getRepository(Hoyoverse);

    schedule.scheduleJob('0 */2 * * *', async () => {
        const today = Utils.dateToInt(new Date());
        const accounts = await hoyoverseRepository.find();

        if (!accounts.length) return;

        for (let account of accounts) {
            const response = await axios.get('https://webapi-os.account.hoyoverse.com/Api/fetch_cookie_accountinfo', {
                headers: {
                    Cookie: account.cookie,
                    ...HoyoConstant.HOYOVERSE_HEADERS,
                },
            });

            if (response.status !== 200) {
                await client.users.send(account.userDiscordId, `❌ Fetch cookie info failed! at index: #${account.id}`);
                continue;
            }

            const responseData = response.data as UpdateHoyolabCookieResponse;
            const { data, ...rest } = responseData;
            if (!data || data.status !== 1 || !data.cookie_info) {
                await client.users.send(account.userDiscordId, `❌ Refresh token failed! at index: #${account.id}`);
                continue;
            }

            const cookieData = Utils.parseCookie(account.cookie, {
                blacklist: ['cookie_token', 'account_id'],
                whitelist: [],
                separator: ';',
            });
            const accountId = data.cookie_info.account_id;
            const token = data.cookie_info.cookie_token;

            await hoyoverseRepository.save({
                ...account,
                cookie: `${cookieData}; cookie_token=${token}; account_id=${accountId}`,
                lastUpdated: today,
            });
        }
    });

    schedule.scheduleJob('0 0 16 * * *', async () => {
        const accounts = await hoyoverseRepository.find();
        sendDiscord(client, 'GENSHIN', accounts);
        sendDiscord(client, 'STARRAIL', accounts);
        sendDiscord(client, 'ZENLESS', accounts);

    });

    console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-DAILY-CHECK-IN`);
};
