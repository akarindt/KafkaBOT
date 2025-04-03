import WuwaNotify from '@entity/wuwa-notify.entity';
import WuwaSubscribe from '@entity/wuwa-subscribe.entity';
import { BOT_FALLBACK_IMG, MAX_TIME_OUT, PRIMARY_EMBED_COLOR } from '@helper/constant.helper';
import { AppDataSource } from '@helper/datasource.helper';
import { BotClient } from '@infrastructure/client.infrastructure';
import { EmbedBuilder } from '@discordjs/builders';
import puppeteer, { Browser, TimeoutError } from 'puppeteer';
import { In } from 'typeorm';
import cron from 'node-cron';
import { WuwaCode } from '@interface/wuwa-code.interface';

export default class WutheringWavesJob {
    private _client: BotClient;

    constructor(client: BotClient) {
        this._client = client;
    }

    private async closeBrowser(browser: Browser) {
        const pages = await browser.pages();
        for (let i = 0; i < pages.length; i++) {
            await pages[i].close();
        }
        await browser.close();
        return;
    }

    public StartCodeChecking() {
        cron.schedule('*/45 * * * *', async () => {
            const browser = await puppeteer.launch({
                args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
            });

            const page = await browser.newPage();
            await page
                .goto('https://www.prydwen.gg/wuthering-waves/', {
                    waitUntil: 'domcontentloaded',
                    timeout: MAX_TIME_OUT,
                })
                .catch(async (err) => {
                    if (err instanceof TimeoutError) {
                        await this.closeBrowser(browser);
                        return;
                    }
                });

            const boxes = await page.$$('div.codes div.box.centered');

            const codes: WuwaCode[] = [];

            for (const box of boxes) {
                const code = await (await box.$('p.code'))?.evaluate((node) => node.textContent);
                const reward = await (await box.$('p.rewards'))?.evaluate((node) => node.textContent);
                const date = await (await box.$('p.date'))?.evaluate((node) => node.textContent);

                if (code && reward && date) {
                    codes.push({
                        code: code.trim(),
                        rewards: reward.trim(),
                        date: date.trim(),
                    });
                }
            }

            await this.SendDiscord(codes);
            await this.closeBrowser(browser);
        });
        console.log('[INFO] Started cron job: WUTHERING-WAVES-CODES-NOTIFICATION');
    }

    private async SendDiscord(codes: WuwaCode[]) {
        const wuwaNotify = AppDataSource.getRepository(WuwaNotify);
        const wuwaSubscribe = AppDataSource.getRepository(WuwaSubscribe);

        const subscribers = await wuwaSubscribe.find();

        const promises = subscribers.map(async (subscriber) => {
            const alreadyNotifiedCodes = (
                await wuwaNotify.find({
                    where: {
                        wuwaSubscribeId: subscriber.id,
                        code: In(codes.map((c) => c.code)),
                    },
                })
            ).map((notify) => notify.code);

            const newCodes = codes.filter((code) => !alreadyNotifiedCodes.includes(code.code));

            if (newCodes.length) {
                const embed = new EmbedBuilder()
                    .setColor(PRIMARY_EMBED_COLOR)
                    .setTitle('New Wuthering Waves codes available!')
                    .setAuthor({
                        name: `Wuthering Waves`,
                        iconURL: 'https://play-lh.googleusercontent.com/ameFGPYH-qhOSxdsSA_fA54I4Ch-eO8y7Pj4x6W6ejQkvKbhVjCehKlPerBY9X2L8ek',
                    })
                    .setFields(
                        newCodes.map((code) => {
                            return {
                                name: `${code.date}`,
                                value: `${code.code} (${code.rewards})`,
                            };
                        })
                    )
                    .setFooter({
                        text: `KafkaBOT - Wuthering Waves Codes Notification`,
                        iconURL: this._client.user?.avatarURL() || BOT_FALLBACK_IMG,
                    })
                    .setTimestamp();

                const notify: WuwaNotify[] = newCodes.map((code) => {
                    const entity = new WuwaNotify();
                    entity.code = code.code;
                    entity.wuwaSubscribeId = subscriber.id;
                    return entity;
                });

                await wuwaNotify.insert(notify);

                await this._client.users.send(subscriber.userDiscordId, { embeds: [embed] });
            }
        });

        await Promise.all(promises);
        return;
    }
}
