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
import puppeteer, { Browser, Page, TimeoutError } from 'puppeteer';
import HoyoverseRedeem from '@/entity/hoyoverseRedeem';
import { In, Not } from 'typeorm';

export default class HoyolabJob {
    private _client: BotClient;

    constructor(client: BotClient) {
        this._client = client;
    }

    private async FetchGENSHIN(page: Page) {
        const currentUrl = page.url();
        console.log(`[INFO] INVOKE GENSHIN - Current url: ${currentUrl}`);

        const gameName = 'GENSHIN';
        const hoyoverseCodeRepository = AppDataSource.getRepository(HoyoverseCode);
        let codes: HoyoverseCodeItem[] = [];

        if (currentUrl.includes('genshin-impact.fandom.com')) {
            const rows = await page.$$('#mw-content-text > div.mw-parser-output > table > tbody > tr');
            for (const row of rows) {
                const code = await (await row.$('td:nth-child(1) code'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''));
                const server = (await (await row.$('td:nth-child(2)'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''))) ?? 'All';
                const rewards = await Promise.all(
                    (
                        await row.$$('td:nth-child(3) .item-text')
                    ).map((x) => x.evaluate((node) => node.textContent?.trim().replace("'", '').replace('\n', '') ?? ''))
                );
                const isActivate = (await (await row.$('td:nth-child(4)'))?.evaluate((node) => node.hasAttribute('style'))) ?? false;
                if (!code) continue;

                codes.push({ gameName, server, code, rewards, isActivate });
                try {
                    await hoyoverseCodeRepository.update(
                        {
                            gameName,
                            code: Not(In(codes.map((x) => x.code))),
                        },
                        {
                            isActivate: false,
                        }
                    );
                    await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                    console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                    return;
                } catch (error) {
                    console.log(`[ERROR] Fetch: Code checking - ${gameName} failed: ${error}`);
                    return;
                }
            }
        }

        if (currentUrl.includes('game8.co')) {
            const rows = await page.$$('h3.a-header--3 + p.a-paragraph + ol.a-orderedList > li.a-listItem');
            for (const row of rows) {
                const textContent = await row.evaluate((node) => node.textContent);
                if (!textContent) continue;

                const split = textContent.split('-');
                const code = split[0].trim();
                const rewards = [split[1].trim().replace("'", '')];
                const server = 'All';
                const isActivate = true;
                codes.push({ gameName, server, code, rewards, isActivate });
            }

            const rows2 = await page.$$('h4.a-header--4:nth-of-type(1) + ol.a-orderedList > li.a-listItem');
            for (const row of rows2) {
                const textContent = await row.evaluate((node) => node.textContent);
                if (!textContent) continue;

                const split = textContent.split('-');
                let code = split[0].trim();
                const server = 'All';
                const rewards = [split[1].trim().replace("'", '')];
                let isActivate = !code.includes('EXPIRED');
                code = code.replace('(EXPIRED)', '').trim();
                codes.push({ gameName, server, code, rewards, isActivate });
            }

            try {
                await hoyoverseCodeRepository.update(
                    {
                        gameName,
                        code: Not(In(codes.map((x) => x.code))),
                    },
                    {
                        isActivate: false,
                    }
                );
                await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                return;
            } catch (error) {
                console.log(`[INFO] Fetch: Code checking - ${gameName} failed: ${error}`);
                return;
            }
        }
    }

    private async FetchSTARRAIL(page: Page) {
        const currentUrl = page.url();
        console.log(`[INFO] INVOKE STARRAIL - Current url: ${page.url()}`);

        const gameName = 'STARRAIL';
        const hoyoverseCodeRepository = AppDataSource.getRepository(HoyoverseCode);
        let codes: HoyoverseCodeItem[] = [];

        if (currentUrl.includes('honkai-star-rail.fandom.com')) {
            const rows = await page.$$('#mw-content-text > div.mw-parser-output > table > tbody > tr');
            for (const row of rows) {
                const code = await (await row.$('td:nth-child(1) code'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''));
                const server = (await (await row.$('td:nth-child(2)'))?.evaluate((node) => node.textContent?.trim().replace('\n', ''))) ?? 'All';
                const rewards = await Promise.all(
                    (
                        await row.$$('td:nth-child(3) .item-text')
                    ).map((x) => x.evaluate((node) => node.textContent?.trim().replace("'", '').replace('\n', '') ?? ''))
                );
                const isActivate = (await (await row.$('td:nth-child(4)'))?.evaluate((node) => node.className))?.includes('bg-new') ?? false;
                if (!code) continue;

                codes.push({ gameName, server, code, rewards, isActivate });

                try {
                    await hoyoverseCodeRepository.update(
                        {
                            gameName,
                            code: Not(In(codes.map((x) => x.code))),
                        },
                        {
                            isActivate: false,
                        }
                    );
                    await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                    console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                    return;
                } catch (error) {
                    console.log(`[ERROR] Fetch: Code checking - ${gameName} failed: ${error}`);
                    return;
                }
            }
        }

        if (currentUrl.includes('game8.co')) {
            const rows = await page.$$('h3#hm_1.a-header--3 + ul.a-list > li.a-listItem');
            for (const row of rows) {
                const textContent = await row.evaluate((node) => node.textContent);
                const code = await (await row.$('a.a-link:nth-of-type(1)'))?.evaluate((node) => node.textContent);
                if (!textContent || !code) continue;

                const split = textContent.split(' (');
                const server = 'All';
                const rewards = ['(' + split[1].trim().replace("'", '')];
                const isActivate = true;

                codes.push({ gameName, code: code.trim(), server, rewards, isActivate });
            }

            try {
                await hoyoverseCodeRepository.update(
                    {
                        gameName,
                        code: Not(In(codes.map((x) => x.code))),
                    },
                    {
                        isActivate: false,
                    }
                );
                await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                return;
            } catch (error) {
                console.log(`[INFO] Fetch: Code checking - ${gameName} failed: ${error}`);
                return;
            }
        }
    }

    private async FetchZENLESS(page: Page) {
        const currentUrl = page.url();
        console.log(`[INFO] INVOKE ZENLESS - Current url: ${page.url()}`);

        const gameName = 'ZENLESS';
        const hoyoverseCodeRepository = AppDataSource.getRepository(HoyoverseCode);
        let codes: HoyoverseCodeItem[] = [];

        if (currentUrl.includes('www.pcgamer.com')) {
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
                let code = split[0].trim().replace('\n', '');

                if (code.includes(' or ')) {
                    code = code.split(' or ')[0];
                }

                const rewards = [split[1].trim().replace('\n', '')];
                const server = 'All';
                const isActivate = false;

                codes.push({ gameName, code, rewards, server, isActivate });
            }

            try {
                await hoyoverseCodeRepository.update(
                    {
                        gameName,
                        code: Not(In(codes.map((x) => x.code))),
                    },
                    {
                        isActivate: false,
                    }
                );
                await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                return;
            } catch (error) {
                console.log(`[ERROR] Fetch: Code checking - ${gameName} failed: ${error}`);
                return;
            }
        }

        if (currentUrl.includes('game8.co')) {
            const rows = await page.$$('h3#hm_1.a-header--3 + ul.a-list > li.a-listItem');
            const rows2 = await page.$$('h3#hm_2.a-header--3 + p.a-paragraph + ul.a-list > li.a-listItem');
            const rows3 = await page.$$('h3#hm_3.a-header--3 + ul.a-list > li.a-listItem');

            let pArr = await page.$$('h3#hm_1.a-header--3 + p.a-paragraph > b.a-bold');
            let dateItem = [];
            for (const p of pArr) {
                const item = await p?.evaluate((node) => node.textContent);
                if (!item) continue;

                dateItem.push(item.trim());
            }

            let expiredDate = new Date(dateItem.join(' '));

            for (const row of rows) {
                const content = await row?.evaluate((node) => node.textContent);
                if (!content) continue;

                const split = content.split('-');
                const code = split[0].trim().replace('\n', '');
                const rewards = [split[1].trim().replace('\n', '')];
                const server = 'All';
                const isActivate = true;

                codes.push({ gameName, server, code, rewards, isActivate });
            }

            for (const row of rows2) {
                const content = await row?.evaluate((node) => node.textContent);
                if (!content) continue;

                const split = content.split('-');
                let code = split[0].trim().replace('\n', '');
                if (code.includes('/')) {
                    code = code.split('/')[0].trim();
                }

                const rewards = [split[1].trim().replace('\n', '')];
                const server = 'All';
                const isActivate = false;

                codes.push({ gameName, server, code, rewards, isActivate });
            }

            for (const row of rows3) {
                const textContent = await row?.evaluate((node) => node.textContent);
                if (!textContent) continue;

                const split = textContent.split('-');
                const code = split[0].trim();
                const server = 'All';
                const rewards = [split[1].trim().replace("'", '')];
                const isActivate = expiredDate > new Date();

                codes.push({ gameName, code, server, rewards, isActivate });
            }

            try {
                await hoyoverseCodeRepository.update(
                    {
                        gameName,
                        code: Not(In(codes.map((x) => x.code))),
                    },
                    {
                        isActivate: false,
                    }
                );
                await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                return;
            } catch (error) {
                console.log(`[ERROR] Fetch: Code checking - ${gameName} failed: ${error}`);
                return;
            }
        }

        if (currentUrl.includes('www.pcgamesn.com')) {
            const activeUl = await page.$$('div.entry-content > ul:nth-of-type(1)');
            const expireUl = await page.$$('div.entry-content > ul:nth-of-type(2)');

            for (const li of activeUl) {
                const content = await li.evaluate((node) => node.textContent);
                if (!content) continue;

                const split = content.split('-');
                const code = split[0].trim().replace('\n', '');
                const rewards = [split[1].trim().replace('\n', '')];
                const server = 'All';
                const isActivate = true;

                codes.push({ gameName, server, code, rewards, isActivate });
            }

            for (const li of expireUl) {
                const content = await li.evaluate((node) => node.textContent);
                if (!content) continue;

                const code = content.trim().replace('\n', '');
                const rewards: string[] = [];
                const server = 'All';
                const isActivate = false;

                codes.push({ gameName, server, code, rewards, isActivate });
            }

            try {
                await hoyoverseCodeRepository.update(
                    {
                        gameName,
                        code: Not(In(codes.map((x) => x.code))),
                    },
                    {
                        isActivate: false,
                    }
                );
                await hoyoverseCodeRepository.upsert(codes, ['code', 'gameName']);
                console.log(`[INFO] Fetch: Code checking - ${gameName} success`);
                return;
            } catch (error) {
                console.log(`[ERROR] Fetch: Code checking - ${gameName} failed: ${error}`);
                return;
            }
        }
    }

    private async InvokeMethod(gameName: HoyoverseConstantName, page: Page) {
        const fnName = `Fetch${gameName}` as keyof this;
        if (typeof this[fnName] === 'function') {
            await (this[fnName] as Function).apply(this, [page]);
        }
    }

    private async CheckCode(gameName: HoyoverseConstantName) {
        const urls = HoyoConstant.HOYOVERSE_GAME_LIST[gameName].url.checkCodeWeb;
        if (!urls) return;

        const closeBrowser = async (browser: Browser) => {
            const pages = await browser.pages();
            for (let i = 0; i < pages.length; i++) {
                await pages[i].close();
            }
            await browser.close();
        };

        let done = false;
        for (let url of urls) {
            if (done) return;

            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });

            const page = await browser.newPage();

            let stop = false;
            await page
                .goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: Misc.MAX_TIME_OUT,
                })
                .catch(async (error) => {
                    if (error instanceof TimeoutError) {
                        stop = true;
                        await closeBrowser(browser);
                    }
                });

            if (stop) continue;

            await this.InvokeMethod(gameName, page);
            await closeBrowser(browser);
            done = true;
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
            await Promise.all([await this.CheckCode('STARRAIL'), await this.CheckCode('ZENLESS')]);
        });
        console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-DAILY-CODE-CHECKING`);
    }

    public async StartHoyolabAutoRedeem() {
        schedule.scheduleJob('0 0 16 * * *', async () => {
            const hoyoverseRepository = AppDataSource.getRepository(Hoyoverse);
            const accounts = await hoyoverseRepository.find();
            await Promise.all([
                await this.SendDiscord('REDEMTION', this._client, 'STARRAIL', accounts),
            ]);
        });
        console.log(`[INFO] Started cron job: HOYOVERSE-AUTO-REDEEM-CODE`);
    }
}
