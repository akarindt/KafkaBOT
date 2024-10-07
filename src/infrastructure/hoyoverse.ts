import { Hoyoverse as HoyoConstant, Misc } from '@/helper/constant';
import Hoyoverse from '@/entity/hoyoverse';
import axios from 'axios';
import HoyoverseCode from '@/entity/hoyoverseCode';
import { Utils } from '@/helper/util';
import { setTimeout } from 'timers/promises';
import { AppDataSource } from '@/helper/datasource';
import HoyoverseRedeem from '@/entity/hoyoverseRedeem';

export type HoyoverseConstantName = 'GENSHIN' | 'HONKAI' | 'STARRAIL' | 'ZENLESS';

export type HoyoverseSignInfo = {
    total_sign_day: number;
    today: string;
    is_sign: boolean;
    is_sub: boolean;
    region: string;
    sign_cnt_missed: number;
    short_sign_day: number;
};

export type HoyoverseCheckIn = {
    code: string;
    risk_code: number;
    gt: string;
    challenge: string;
    success: number;
    is_risk: boolean;
};

export type HoyoverseInfoData = {
    total_sign_day: number;
    today: string;
    is_sign: boolean;
    is_sub: boolean;
    region: string;
    sign_cnt_missed: number;
    short_sign_day: number;
};

export type HoyoverseAccountData = {
    list: {
        has_role: boolean;
        game_id: number;
        game_role_id: string;
        nickname: string;
        region: string;
        level: number;
        background_image: string;
        is_public: boolean;
        data: {
            name: string;
            type: number;
            value: string;
        }[];
        region_name: string;
        url: string;
        data_switches: {
            switch_id: number;
            is_public: boolean;
            switch_name: string;
        }[];
        h5_data_switches: any[];
        background_color: string;
        background_image_v2: string;
        logo: string;
        game_name: string;
    }[];
};

export type HoyoverseResponse = {
    retcode: number;
    message: string;
    data: HoyoverseCheckIn | HoyoverseInfoData | HoyoverseAccountData | HoyoverseAwardData | null;
};

export type HoyoverseAwardData = {
    month: number;
    awards: {
        icon: string;
        name: string;
        cnt: number;
    }[];
    biz: string;
    resign: boolean;
    short_extra_reward: {
        has_extra_award: boolean;
        start_time: string;
        end_time: string;
        list: {
            icon: string;
            name: string;
            cnt: number;
            sign_date: number;
            high_light: boolean;
        }[];
        start_timestamp: string;
        end_timestamp: string;
    };
};

export type HoyoverseGame = {
    ACT_ID: string;
    success: string;
    signed: string;
    gameId: number;
    gameName: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    url: {
        info: string;
        home: string;
        sign: string;
        redem?: string;
        checkCodeWeb?: string;
    };
};

export type ExecuteCheckIn = {
    userDiscordId: string;
    platform: string;
    result: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    account: AccountDetails;
};

export type UpdateHoyolabCookieResponse = {
    code: number;
    data?: {
        cookie_info: {
            account_id: number;
            account_name: string;
            area_code: string;
            cookie_token: string;
            cur_time: number;
            email: string;
            mobile: string;
        };
        info: string;
        msg: string;
        sign: string;
        status: number;
    };
};

export type HoyoverseCodeItem = {
    gameName: string;
    code: string;
    rewards: string[];
    isActivate: boolean;
    server: string;
};

export type HoyoverseCodeRedeem = {
    success: HoyoverseCode[];
    failed: HoyoverseCode[];
    account: AccountDetails;
    userDiscordId: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    hoyoverseId: number
};

type AccountDetails = {
    uid: string;
    nickname: string;
    rank: number;
    region: string;
    ingame_region: string;
};

export class HoyoverseClient {
    private _name: HoyoverseConstantName;
    private _game: HoyoverseGame;
    private _data: Hoyoverse[];
    private _fullName: string;
    private _userAgent: string;
    private _updateApi: string;

    constructor(name: HoyoverseConstantName, data: Hoyoverse[]) {
        this._name = name;
        this._data = data;
        this._fullName = HoyoConstant.HOYOVERSE_GAME_LIST[this._name].gameName;
        this._game = HoyoConstant.HOYOVERSE_GAME_LIST[this._name];
        this._userAgent = Misc.USER_AGENT;
        this._updateApi = HoyoConstant.HOYOVERSE_UPDATE_COOKIE_API;

        if (!this._data.length) {
            console.log(`[WARNING] No ${this._fullName} accounts provided. Skipping...`);
            return;
        }
    }

    public get userAgent() {
        return this._userAgent;
    }

    public get updateApi() {
        return this._updateApi;
    }

    async CheckAndExecute(): Promise<ExecuteCheckIn[]> {
        const accounts = this._data;
        if (!accounts.length) {
            console.log(`[WARNING] No active accounts found for ${this._fullName}`);
            return [];
        }

        const success: ExecuteCheckIn[] = [];
        for (const account of accounts) {
            try {
                const cookie = account.cookie;
                const ltuid = cookie.match(/ltuid_v2=([^;]+)/);
                let accountDetails: AccountDetails | null = null;
                if (ltuid) {
                    accountDetails = await this.GetAccountDetails(cookie, ltuid[1]);
                }

                if (!accountDetails) {
                    continue;
                }

                const sign = await this.Sign(cookie);
                if (!sign.success) {
                    continue;
                }

                success.push({
                    platform: this._name,
                    result: this._game.success,
                    assets: this._game.assets,
                    account: {
                        uid: accountDetails.uid,
                        nickname: accountDetails.nickname,
                        rank: accountDetails.rank,
                        region: accountDetails.region,
                        ingame_region: accountDetails.ingame_region,
                    },
                    userDiscordId: account.userDiscordId,
                });
            } catch (error) {
                console.log(`[ERROR] An error occurred : ${error}`);
            }
        }
        return success;
    }

    async GetAccountDetails(cookie: string, ltuid: string): Promise<AccountDetails | null> {
        try {
            const response = await axios.get(`${HoyoConstant.HOYOVERSE_RECORD_CARD_API}?uid=${ltuid}`, {
                headers: {
                    Cookie: cookie,
                    'User-Agent': this._userAgent,
                },
            });

            const data = response.data as HoyoverseResponse;
            if (response.status !== 200 || data.retcode !== 0) {
                console.log(`[ERROR] Failed to login to ${this._fullName} account: ${JSON.stringify(data.message)}`);
                return null;
            }

            const accountData = (data.data as HoyoverseAccountData).list.find((x) => x.game_id === this._game.gameId);
            if (!accountData) {
                console.log(`[ERROR] No ${this._fullName} account found for ltuid: ${ltuid}`);
                return null;
            }

            return {
                uid: accountData.game_role_id,
                nickname: accountData.nickname,
                rank: accountData.level,
                region: this.FixRegion(accountData.region),
                ingame_region: accountData.region,
            };
        } catch (error) {
            console.log(`[ERROR] Error: ${error} at ${this._fullName}`);
            return null;
        }
    }

    async Sign(cookie: string): Promise<{ success: boolean }> {
        try {
            const response = await axios.post(
                this._game.url.sign,
                {
                    act_id: this._game.ACT_ID,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': this._userAgent,
                        Cookie: cookie,
                    },
                }
            );

            const data = response.data as HoyoverseResponse;
            if (response.status !== 200 || data.retcode !== 0) {
                console.log(`[ERROR] Failed to login to ${this._fullName} account: ${JSON.stringify(data.message)}`);
                return { success: false };
            }

            return { success: true };
        } catch (error) {
            console.log(`[ERROR] Error: ${error} at ${this._fullName}`);
            return { success: false };
        }
    }

    async Redeem() {
        let url = this._game.url.redem;
        if (!url) return [];

        const accounts = this._data;
        const success: HoyoverseCode[] = [];
        const failed: HoyoverseCode[] = [];

        if (!accounts.length) {
            console.log(`[WARNING] No active accounts found for ${this._fullName}`);
            return [];
        }

        const results: HoyoverseCodeRedeem[] = [];

        for (const account of accounts) {
            try {
                const cookie = account.cookie;
                const ltuid = cookie.match(/ltuid_v2=([^;]+)/);
                let accountDetails: AccountDetails | null = null;

                const currentId = await AppDataSource.getRepository(Hoyoverse)
                    .createQueryBuilder('A')
                    .where('A.userDiscordId = :userDiscordId', { userDiscordId: account.userDiscordId })
                    .andWhere('A.cookie = :cookie', { cookie: account.cookie })
                    .getOne();

                if(!currentId) continue;

                const codeList = await AppDataSource.getRepository(HoyoverseCode)
                    .createQueryBuilder('A')
                    .where((qb) => {
                        const subQuery = qb
                            .subQuery()
                            .select('B.code')
                            .from(HoyoverseRedeem, 'B')
                            .innerJoin(Hoyoverse, 'C', 'B.hoyoverseId = C.id')
                            .where('B.gameName = :gameName', { gameName: this._name })
                            .andWhere('C.userDiscordId = :userDiscordId', { userDiscordId: account.userDiscordId })
                            .andWhere('C.cookie = :cookie', { cookie: account.cookie })
                            .getQuery();

                        return 'A.code NOT IN ' + subQuery;
                    })
                    .setParameter('gameName', this._name)
                    .setParameter('userDiscordId', account.userDiscordId)
                    .setParameter('cookie', account.cookie)
                    .andWhere('A.isActivate = :isActivate', { isActivate: true })
                    .andWhere('A.gameName = :gameName', { gameName: this._name })
                    .getMany();

                if (ltuid) {
                    accountDetails = await this.GetAccountDetails(cookie, ltuid[1]);
                }

                if (!accountDetails) {
                    continue;
                }

                if (this._name == 'GENSHIN') {
                    for (const code of codeList) {
                        const cookieData = Utils.parseCookie(account.cookie, {
                            whitelist: ['cookie_token_v2', 'account_mid_v2', 'account_id_v2', 'cookie_token', 'account_id'],
                            blacklist: [],
                            separator: ';',
                        });

                        let endp = `${url}?uid=${accountDetails.uid}&region=${accountDetails.ingame_region}&lang=en`;
                        endp += `&cdkey=${code.code}&game_biz=hk4e_global&sLangKey=en-us`;

                        const res = await axios.get(endp, {
                            headers: {
                                Cookie: cookieData,
                                'User-Agent': this._userAgent,
                            },
                        });

                        if (res.status !== 200) {
                            console.log('[ERROR] Genshin: API returned non-200 status code.');
                            failed.push(code);
                            await setTimeout(7000);
                            continue;
                        }

                        const data = res.data as HoyoverseResponse;
                        if (data.retcode !== 0) {
                            console.log('[ERROR] Genshin: API returned non-200 status code.');
                            failed.push(code);
                            await setTimeout(7000);
                            continue;
                        }

                        success.push(code);
                        await setTimeout(7000);
                        continue;
                    }
                }

                if (this._name == 'STARRAIL') {
                    for (const code of codeList) {
                        const cookieData = Utils.parseCookie(account.cookie, {
                            whitelist: ['cookie_token_v2', 'account_mid_v2', 'account_id_v2', 'cookie_token', 'account_id'],
                            blacklist: [],
                            separator: ';',
                        });

                        const res = await axios.post(
                            url,
                            {
                                cdkey: code.code,
                                game_biz: 'hkrpg_global',
                                lang: 'en',
                                region: accountDetails.ingame_region,
                                t: Date.now(),
                                uid: accountDetails.uid,
                            },
                            {
                                headers: {
                                    Cookie: cookieData,
                                },
                            }
                        );

                        if (res.status !== 200) {
                            console.log('[ERROR] STARRAIL: API returned non-200 status code.');
                            failed.push(code);
                            await setTimeout(7000);
                            continue;
                        }

                        const data = res.data as HoyoverseResponse;
                        if (data.retcode !== 0) {
                            console.log('[ERROR] STARRAIL: API returned non-200 status code.');
                            failed.push(code);
                            await setTimeout(7000);
                            continue;
                        }

                        success.push(code);
                        await setTimeout(7000);
                        continue;
                    }
                }

                if (this._name == 'ZENLESS') {
                    for (const code of codeList) {
                        const cookieData = Utils.parseCookie(account.cookie, {
                            whitelist: ['cookie_token_v2', 'account_mid_v2', 'account_id_v2', 'cookie_token', 'account_id'],
                            blacklist: [],
                            separator: ';',
                        });

                        let endp = `${url}?t=${Date.now()}&lang=en&game_biz=nap_global&uid=${accountDetails.uid}`;
                        endp += `&region=${accountDetails.ingame_region}&cdkey=${code.code}`;

                        const res = await axios.get(endp, {
                            headers: {
                                Cookie: cookieData,
                                'User-Agent': this._userAgent,
                            },
                        });

                        if (res.status !== 200) {
                            console.log('[ERROR] ZENLESS: API returned non-200 status code.');
                            failed.push(code);
                            await setTimeout(7000);
                            continue;
                        }

                        const data = res.data as HoyoverseResponse;
                        if (data.retcode !== 0) {
                            console.log('[ERROR] ZENLESS: API returned non-200 status code.');
                            failed.push(code);
                            await setTimeout(7000);
                            continue;
                        }

                        success.push(code);
                        await setTimeout(7000);
                        continue;
                    }
                }

                results.push({
                    success,
                    failed,
                    hoyoverseId: currentId.id,
                    userDiscordId: account.userDiscordId,
                    account: {
                        uid: accountDetails.uid,
                        nickname: accountDetails.nickname,
                        rank: accountDetails.rank,
                        region: accountDetails.region,
                        ingame_region: accountDetails.ingame_region,
                    },
                    assets: this._game.assets,
                });
            } catch (error) {
                console.log(`[ERROR] An error occurred : ${error}`);
            }
        }

        return results;
    }

    FixRegion(region: string) {
        switch (region) {
            case 'os_cht':
            case 'prod_gf_sg':
            case 'prod_official_cht':
                return 'TW';
            case 'os_asia':
            case 'prod_gf_jp':
            case 'prod_official_asia':
                return 'SEA';
            case 'eur01':
            case 'os_euro':
            case 'prod_gf_eu':
            case 'prod_official_eur':
                return 'EU';
            case 'usa01':
            case 'os_usa':
            case 'prod_gf_us':
            case 'prod_official_usa':
                return 'NA';
            default:
                return 'Unknown';
        }
    }
}
