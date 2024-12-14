import Hoyoverse from '@/entity/hoyoverse';
import { AppDataSource } from '@/helper/datasource';
import { BotClient } from '@/infrastructure/client';
import schedule from 'node-schedule';
import { HoyoverseAxiosResponse, HoyoverseClient, HoyoverseCodeItem, HoyoverseConstantName, UpdateHoyolabCookieResponse } from '@/infrastructure/hoyoverse';
import { Utils } from '@/helper/util';
import axios from 'axios';
import { Hoyoverse as HoyoConstant, Misc } from '@/helper/constant';
import { EmbedBuilder } from 'discord.js';
import HoyoverseCode from '@/entity/hoyoverseCode';
import HoyoverseRedeem from '@/entity/hoyoverseRedeem';

export default class HoyolabJob {
    private _client: BotClient;

    constructor(client: BotClient) {
        this._client = client;
    }


    private async CheckCode(gameName: HoyoverseConstantName) {
        try {
            const url = (HoyoConstant.HOYOVERSE_GAME_LIST[gameName].url.checkCodeWeb ?? []).pop();
            if (!url) return;
    
            const response = await axios.get<HoyoverseAxiosResponse>(url);
            if (response.status !== 200) return;
    
            const data = response.data;
            let codes: HoyoverseCodeItem[] = [];
            const hoyoverseCodeRepository = AppDataSource.getRepository(HoyoverseCode);
    
            for (let activeCode of data.active) {
                codes.push({
                    gameName: gameName,
                    code: activeCode.code,
                    rewards: activeCode.reward,
                    isActivate: true,
                    server: 'All'
                })
            }
    
            for (let inactiveCode of data.inactive) {
                codes.push({
                    gameName: gameName,
                    code: inactiveCode.code,
                    rewards: inactiveCode.reward,
                    isActivate: false,
                    server: 'All'
                })
            }
            await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
            return;
        } catch (error) {
            console.log(`[ERROR] Fetch: Code checking - ${gameName} failed: ${error}`);
            return;
        }
    }

    private async SendDiscord(methodName: string, client: BotClient, gameName: HoyoverseConstantName, data: Hoyoverse[]) {
        const game = new HoyoverseClient(gameName, data);

        try {
            switch (methodName) {
                case 'CHECKIN':
                    const checkinResults = await game.CheckAndExecute();
                    const SendCheckInPromises = checkinResults.map(async (result) => {
                        const embed = new EmbedBuilder()
                            .setColor(Misc.PRIMARY_EMBED_COLOR)
                            .setTitle(`${result.assets.gameName} Daily Check-In`)
                            .setAuthor({
                                name: `${result.account.uid} - ${result.account.nickname}`,
                                iconURL: result.assets.icon,
                            })
                            .setFields(
                                {
                                    name: 'Nickname',
                                    value: result.account.nickname,
                                    inline: true,
                                },
                                {
                                    name: 'UID',
                                    value: result.account.uid,
                                    inline: true,
                                },
                                {
                                    name: 'Rank',
                                    value: result.account.rank.toString(),
                                    inline: true,
                                },
                                {
                                    name: 'Region',
                                    value: result.account.region,
                                    inline: true,
                                },
                                {
                                    name: 'Result',
                                    value: result.result,
                                    inline: false,
                                }
                            )
                            .setTimestamp()
                            .setFooter({
                                text: `${result.assets.gameName} Daily Check-In`,
                                iconURL: client.user?.avatarURL() || '',
                            });
                        await client.users.send(result.userDiscordId, { embeds: [embed] });
                    });

                    await Promise.all(SendCheckInPromises);
                    break;

                case 'REDEMTION':
                    const redeemResults = await game.Redeem();
                    const SendRedeemPromises = redeemResults.map(async (result) => {
                        if (result.success.length || result.failed.length) {
                            const embed = new EmbedBuilder()
                                .setColor(Misc.PRIMARY_EMBED_COLOR)
                                .setTitle(`${result.assets.gameName} Code Redemption`)
                                .setAuthor({
                                    name: `${result.account.uid} - ${result.account.nickname}`,
                                    iconURL: result.assets.icon,
                                })
                                .setFields(
                                    {
                                        name: 'Nickname',
                                        value: result.account.nickname,
                                        inline: true,
                                    },
                                    {
                                        name: 'UID',
                                        value: result.account.uid,
                                        inline: true,
                                    },
                                    {
                                        name: 'Rank',
                                        value: result.account.rank.toString(),
                                        inline: true,
                                    },
                                    {
                                        name: 'Region',
                                        value: result.account.region,
                                        inline: true,
                                    },
                                    {
                                        name: 'Code',
                                        value: `Redeem ${result.success.length} codes successfully, please check your ingame-mail !`,
                                        inline: true,
                                    },
                                    {
                                        name: 'Failed (Invalid or Expired code)',
                                        value:
                                            result.failed.length > 0
                                                ? result.failed
                                                    .map((fail) => {
                                                        return `[${fail.code}](${HoyoConstant.HOYOVERSE_REDEMTION_LINKS[gameName]}?code=${fail.code})`;
                                                    })
                                                    .join('\n')
                                                : 'None',
                                    }
                                )
                                .setTimestamp()
                                .setFooter({
                                    text: `${result.assets.gameName} Code Redemption`,
                                    iconURL: client.user?.avatarURL() || '',
                                });

                            const codes = [...result.success, ...result.failed];
                            const entites: HoyoverseRedeem[] = [];
                            for (const code of codes) {
                                const entity = new HoyoverseRedeem();
                                entity.hoyoverseId = result.hoyoverseId;
                                entity.code = code.code;
                                entity.gameName = code.gameName;
                                entity.redeemAt = Utils.dateToInt(new Date());
                                entites.push(entity);
                            }

                            await AppDataSource.getRepository(HoyoverseRedeem).insert(entites);
                            await client.users.send(result.userDiscordId, { embeds: [embed] });
                        }
                    });
                    await Promise.all(SendRedeemPromises);
                    break;
            }
            return;
        } catch (error) {
            console.log(`[ERROR] ${methodName} - An error occurred: ${error}`);
            return;
        }
    }

    public async StartHoyolabCheckInJob() {
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
                    await this._client.users.send(account.userDiscordId, `❌ Fetch cookie info failed! at index: #${account.id}`);
                    continue;
                }

                const responseData = response.data as UpdateHoyolabCookieResponse;
                const { data, ...rest } = responseData;
                if (!data || data.status !== 1 || !data.cookie_info) {
                    await this._client.users.send(account.userDiscordId, `❌ Refresh token failed! at index: #${account.id}`);
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

            console.log(`[INFO] Refresh token success!`);
        });

        schedule.scheduleJob('0 0 16 * * *', async () => {
            const accounts = await hoyoverseRepository.find();
            await Promise.all([
                await this.SendDiscord('CHECKIN', this._client, 'GENSHIN', accounts),
                await this.SendDiscord('CHECKIN', this._client, 'STARRAIL', accounts),
                await this.SendDiscord('CHECKIN', this._client, 'ZENLESS', accounts),
            ]);
        });

        console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-DAILY-CHECK-IN`);
    }

    public async StartCheckCodeJob() {
        schedule.scheduleJob('*/30 * * * *', async () => {
            await Promise.all([
                await this.CheckCode('STARRAIL'),
                await this.CheckCode('ZENLESS'),
                await this.CheckCode('GENSHIN')
            ]);
        });
        console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-DAILY-CODE-CHECKING`);
    }

    public async StartHoyolabAutoRedeem() {
        schedule.scheduleJob('0 */2 * * * *', async () => {
            const hoyoverseRepository = AppDataSource.getRepository(Hoyoverse);
            const accounts = await hoyoverseRepository.find();
            await this.SendDiscord('REDEMTION', this._client, 'STARRAIL', accounts)
        });
        console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-REDEEM-CODE`);
    }
}
