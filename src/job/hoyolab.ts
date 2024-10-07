import Hoyoverse from '@/entity/hoyoverse';
import { AppDataSource } from '@/helper/datasource';
import { BotClient } from '@/infrastructure/client';
import schedule from 'node-schedule';
import { HoyoverseClient, HoyoverseCodeItem, HoyoverseConstantName, UpdateHoyolabCookieResponse } from '@/infrastructure/hoyoverse';
import { Utils } from '@/helper/util';
import axios from 'axios';
import { Hoyoverse as HoyoConstant, Misc } from '@/helper/constant';
import { EmbedBuilder } from 'discord.js';
import HoyoverseCode from '@/entity/hoyoverseCode';
import puppeteer from 'puppeteer';
import HoyoverseRedeem from '@/entity/hoyoverseRedeem';

const sendDiscordCheckinStatus = (client: BotClient, gameName: HoyoverseConstantName, data: Hoyoverse[]) => {
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
                        }
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

const sendDiscordCodeRedeem = async (client: BotClient, gameName: HoyoverseConstantName, data: Hoyoverse[]) => {
    const game = new HoyoverseClient(gameName, data);
    const results = await game.Redeem();
    for (const result of results) {
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
                                : '',
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
                (entity.hoyoverseId = result.hoyoverseId),
                    (entity.code = code.code),
                    (entity.gameName = code.gameName),
                    (entity.redeemAt = Utils.dateToInt(new Date()));
                entites.push(entity);
            }

            await AppDataSource.getRepository(HoyoverseRedeem).insert(entites);
            await client.users.send(result.userDiscordId, { embeds: [embed] });
        }
    }
};

const checkCode = async (gameName: HoyoverseConstantName) => {
    try {
        const hoyoverseCodeRepository = AppDataSource.getRepository(HoyoverseCode);
        const url = HoyoConstant.HOYOVERSE_GAME_LIST[gameName].url.checkCodeWeb;

        if (!url) return;

        if (gameName == 'GENSHIN') {
            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });;
            const page = await browser.newPage();

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
            });

            const rows = await page.$$('#mw-content-text > div.mw-parser-output > table > tbody > tr');
            let codes: HoyoverseCodeItem[] = [];

            for (const row of rows) {
                const code = await (await row.$('td:nth-child(1) code'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''));
                const server = (await (await row.$('td:nth-child(2)'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''))) ?? 'All';
                const rewards = await Promise.all(
                    (await row.$$('td:nth-child(3) .item-text')).map((x) => x.evaluate((node) => node.textContent?.trim().replace('\n', '') ?? ''))
                );
                const isActivate = (await (await row.$('td:nth-child(4)'))?.evaluate((node) => node.hasAttribute('style'))) ?? false;
                if (!code) continue;

                codes.push({ gameName, server, code, rewards, isActivate });
            }
            await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
            const pages = await browser.pages();
            for (let i = 0; i < pages.length; i++) {
                await pages[i].close();
            }
            await browser.close()
        }

        if (gameName == 'STARRAIL') {
            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });;
            const page = await browser.newPage();

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
            });

            let codes: HoyoverseCodeItem[] = [];

            const rows = await page.$$('#mw-content-text > div.mw-parser-output > table > tbody > tr');
            for (const row of rows) {
                const code = await (await row.$('td:nth-child(1) code'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''));
                const server = (await (await row.$('td:nth-child(2)'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''))) ?? 'All';
                const rewards = await Promise.all(
                    (await row.$$('td:nth-child(3) .item-text')).map((x) => x.evaluate((node) => node.textContent?.trim().replace('\n', '') ?? ''))
                );
                const isActivate = (await (await row.$('td:nth-child(4)'))?.evaluate((node) => node.className))?.includes('bg-new') ?? false;
                if (!code) continue;

                codes.push({ gameName, server, code, rewards, isActivate });
            }

            await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
            const pages = await browser.pages();
            for (let i = 0; i < pages.length; i++) {
                await pages[i].close();
            }
            await browser.close()
        }

        if (gameName == 'ZENLESS') {
            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });;
            const page = await browser.newPage();

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
            });

            let codes: HoyoverseCodeItem[] = [];
            const activeUl = await page.$$('div#article-body > ul:nth-of-type(1) > li');
            const expireUl = await page.$$('div#article-body > ul:nth-of-type(2) > li');
            for (const li of activeUl) {
                const content = await li.evaluate((node) => node.textContent);
                if (!content) continue;
                if (!content.includes('-')) continue;
                const split = content.split('-');
                let code = split[0].trim().replace('\n', '');

                if (code.includes(' or ')) {
                    code = code.split(' or ')[0];
                }

                const rewards = [split[1].trim().replace('\n', '')];
                const server = 'All';
                const isActivate = true;

                codes.push({ gameName, code, rewards, server, isActivate });
            }

            for (const li of expireUl) {
                const content = await li.evaluate((node) => node.textContent);
                if (!content) continue;
                if (!content.includes('-')) continue;
                const split = content.split('-');
                const code = split[0].trim().replace('\n', '');
                const rewards = [split[1].trim().replace('\n', '')];
                const server = 'All';
                const isActivate = false;

                codes.push({ gameName, code, rewards, server, isActivate });
            }

            await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
            const pages = await browser.pages();
            for (let i = 0; i < pages.length; i++) {
                await pages[i].close();
            }
            await browser.close()
        }

        console.log(`[INFO] Update ${HoyoConstant.HOYOVERSE_GAME_LIST[gameName].gameName}'s redeem codes successfully`);
    } catch (error) {
        console.log(`[ERROR] Update ${HoyoConstant.HOYOVERSE_GAME_LIST[gameName].gameName}'s redeem codes failed`);
    }
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

        console.log(`[INFO] Refresh token success!`);
    });

    schedule.scheduleJob('0 0 16 * * *', async () => {
        const accounts = await hoyoverseRepository.find();
        sendDiscordCheckinStatus(client, 'GENSHIN', accounts);
        sendDiscordCheckinStatus(client, 'STARRAIL', accounts);
        sendDiscordCheckinStatus(client, 'ZENLESS', accounts);
    });

    console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-DAILY-CHECK-IN`);
};

export const StartCheckCodeJob = async () => {
    schedule.scheduleJob('*/30 * * * *', async () => {
        await Promise.all([await checkCode('GENSHIN'), await checkCode('STARRAIL'), await checkCode('ZENLESS')]);
    });
    console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-DAILY-CODE-CHECKING`);
};

export const StartHoyolabAutoRedeem = async (client: BotClient) => {
    schedule.scheduleJob('0 0 16 * * *', async () => {
        const hoyoverseRepository = AppDataSource.getRepository(Hoyoverse);
        const accounts = await hoyoverseRepository.find();
        await sendDiscordCodeRedeem(client, 'STARRAIL', accounts);
    });
    console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-REDEEM-CODE`);
};
