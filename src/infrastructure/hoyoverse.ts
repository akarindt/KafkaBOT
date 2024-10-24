import { Hoyoverse as HoyoConstant, Misc } from '@/helper/constant';
import Hoyoverse from '@/entity/hoyoverse';
import axios from 'axios';
import HoyoverseCode from '@/entity/hoyoverseCode';
import { Utils } from '@/helper/util';
import { setTimeout } from 'timers/promises';
import { AppDataSource } from '@/helper/datasource';
import HoyoverseRedeem from '@/entity/hoyoverseRedeem';
import { In, Not } from 'typeorm';

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
        checkCodeWeb?: string[];
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
    hoyoverseId: number;
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

        const CheckinPromises = accounts.map(async (account) => {
            try {
                const cookie = account.cookie;
                const ltuid = cookie.match(/ltuid_v2=([^;]+)/);
                if (!ltuid) return null;

                const accountDetails = await this.GetAccountDetails(cookie, ltuid[1]);
                if (!accountDetails) return null;

                const sign = await this.Sign(cookie);
                if (!sign.success) return null;

                return {
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
                };
            } catch (error) {
                console.log(`[ERROR] Checkin error: ${error}`);
                return null;
            }
        });

        const results = await Promise.all(CheckinPromises);
        return results.filter((result) => result != null);
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
                        Cookie: cookie,
                        ...HoyoConstant.HOYOVERSE_GAME_HEADERS[this._name],
                        ...HoyoConstant.HOYOVERSE_HEADERS
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
        let accounts = this._data;

        if (!url) {
            console.log(`[ERROR] Redeem code - ${this._game.gameName} doesn't have redeem function`);
            return [];
        }

        const RedeemPromises = accounts.map(async (account) => {
            try {
                const cookie = account.cookie;

                const ltuid = cookie.match(/ltuid_v2=([^;]+)/);
                if (!ltuid) return null;

                const accountDetails = await this.GetAccountDetails(cookie, ltuid[1]);
                if (!accountDetails) return null;

                const hoyoverseRedeemRepository = AppDataSource.getRepository(HoyoverseRedeem);
                const codeRepository = AppDataSource.getRepository(HoyoverseCode);

                const redeemedList = await hoyoverseRedeemRepository.find({
                    where: {
                        hoyoverseId: account.id,
                    },
                });

                const codeList = await codeRepository.find({
                    where: {
                        isActivate: true,
                        gameName: this._name,
                        code: Not(In(redeemedList.map((x) => x.code))),
                    },
                });

                if (!codeList.length) return null;

                const success: HoyoverseCode[] = [];
                const failed: HoyoverseCode[] = [];

                const CodeRedeemPromises = codeList.map(async (code) => {
                    try {
                        const cookieData = Utils.parseCookie(account.cookie, {
                            whitelist: ['cookie_token_v2', 'account_mid_v2', 'account_id_v2', 'cookie_token', 'account_id'],
                            blacklist: [],
                            separator: ';',
                        });

                        let endp = '';
                        switch (this._name) {
                            case 'GENSHIN':
                                endp = url;
                                endp += `?uid=${accountDetails.uid}`;
                                endp += `&region=${accountDetails.ingame_region}`;
                                endp += `&lang=en`;
                                endp += `&cdkey=${code.code}`;
                                endp += `&game_biz=hk4e_global`;
                                endp += `&sLangKey=en-us`;
                                break;
                            case 'ZENLESS':
                                endp = url;
                                endp += `?t=${Date.now()}`;
                                endp += `&lang=en`;
                                endp += `&game_biz=nap_global`;
                                endp += `&uid=${accountDetails.uid}`;
                                endp += `&region=${accountDetails.ingame_region}`;
                                endp += `&cdkey=${code.code}`;
                                break;
                            case 'STARRAIL':
                                endp = url;
                                break;
                        }

                        const res = await (this._name === 'STARRAIL'
                            ? axios.post(
                                  endp,
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
                              )
                            : axios.get(endp, {
                                  headers: {
                                      Cookie: cookieData,
                                      'User-Agent': this._userAgent,
                                  },
                              }));

                        if (res.status !== 200 || res.data.retcode !== 0) {
                            console.log(`[ERROR] ${this._name}: API returned non-200 or error status code.`);
                            failed.push(code);
                        } else {
                            success.push(code);
                        }

                        await setTimeout(7000);
                    } catch (error) {
                        console.log(`[ERROR] Code redemption error for ${this._name}: ${error}`);
                        failed.push(code);
                        await setTimeout(7000);
                    }
                });

                await Promise.all(CodeRedeemPromises);
                return {
                    success,
                    failed,
                    hoyoverseId: account.id,
                    userDiscordId: account.userDiscordId,
                    account: {
                        uid: accountDetails.uid,
                        nickname: accountDetails.nickname,
                        rank: accountDetails.rank,
                        region: accountDetails.region,
                        ingame_region: accountDetails.ingame_region,
                    },
                    assets: this._game.assets,
                };
            } catch (error) {
                console.log(`[ERROR] Code redeem error: ${error}`);
                return null;
            }
        });

        const results = await Promise.all(RedeemPromises);
        return results.filter((result) => result !== null);
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
