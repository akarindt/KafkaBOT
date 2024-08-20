import { Hoyoverse as HoyoConstant, Misc } from '@/helper/constant';
import Hoyoverse from '@/entity/hoyoverse';
import axios from 'axios';

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
    };
};

export type ExecuteCheckIn = {
    userDiscordId: string;
    platform: string;
    total: number;
    result: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    account: AccountDetails;
    award: {
        name: string;
        count: number;
        icon: string;
    };
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

type AccountDetails = {
    uid: string;
    nickname: string;
    rank: number;
    region: string;
};

type SignInfo = {
    success: boolean;
    data?: null | {
        total: number;
        today: string;
        isSigned: boolean;
    };
};

type AwardsData = {
    success: boolean;
    data?:
        | null
        | {
              icon: string;
              name: string;
              cnt: number;
          }[];
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
        this._fullName =  HoyoConstant.HOYOVERSE_GAME_LIST[this._name].gameName;
        this._game =  HoyoConstant.HOYOVERSE_GAME_LIST[this._name];
        this._userAgent = Misc.USER_AGENT;
        this._updateApi =  HoyoConstant.HOYOVERSE_UPDATE_COOKIE_API;

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

                const info = await this.GetSignInfo(cookie);
                if (!info.success) {
                    continue;
                }

                const awardsData = await this.GetAwardsData(cookie);
                if (!awardsData.success) {
                    continue;
                }

                if (!info.data || !awardsData.data) {
                    continue;
                }

                const awards = awardsData.data;
                const data = {
                    total: info.data.total,
                    today: info.data.today,
                    isSigned: info.data.isSigned,
                };

                if (data.isSigned) {
                    continue;
                }

                const totalSigned = data.total;
                const awardObj = {
                    name: awards[totalSigned].name,
                    count: awards[totalSigned].cnt,
                    icon: awards[totalSigned].icon,
                };

                const sign = await this.Sign(cookie);
                if (!sign.success) {
                    continue;
                }

                success.push({
                    platform: this._name,
                    total: data.total + 1,
                    result: this._game.success,
                    assets: this._game.assets,
                    account: {
                        uid: accountDetails.uid,
                        nickname: accountDetails.nickname,
                        rank: accountDetails.rank,
                        region: accountDetails.region,
                    },
                    award: awardObj,
                    userDiscordId: account.userDiscordId
                });
            } catch (error) {
                console.log(`[ERROR] CHECKIN - An error occurred`);
            }
        }
        return success;
    }

    async GetAccountDetails(cookie: string, ltuid: string): Promise<AccountDetails | null> {
        try {
            const response = await axios.get(`${ HoyoConstant.HOYOVERSE_RECORD_CARD_API}?uid=${ltuid}`, {
                headers: {
                    'User-Agent': this._userAgent,
                    Cookie: cookie,
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
            };
        } catch (error) {
            console.log(`[ERROR] Error: ${error} at ${this._fullName}`);
            return null;
        }
    }

    async GetSignInfo(cookie: string): Promise<SignInfo> {
        try {
            const response = await axios.get(`${this._game.url.home}?act_id=${this._game.ACT_ID}`, {
                headers: {
                    Cookies: cookie,
                },
            });

            const data = response.data as HoyoverseResponse;
            if (response.status !== 200 || data.retcode !== 0) {
                console.log(`[ERROR] Failed to get sign info at ${this._fullName}: ${JSON.stringify(data.message)}`);
                return { success: false };
            }

            const signInfo = data.data as HoyoverseSignInfo;

            return {
                success: true,
                data: {
                    total: signInfo.total_sign_day,
                    today: signInfo.today,
                    isSigned: signInfo.is_sign,
                },
            };
        } catch (error) {
            console.log(`[ERROR] Error: ${error} at ${this._fullName}`);
            return { success: false };
        }
    }

    async GetAwardsData(cookie: string): Promise<AwardsData> {
        try {
            const response = await axios.get(`${this._game.url.home}?act_id=${this._game.ACT_ID}`, {
                headers: {
                    Cookies: cookie,
                },
            });

            const data = response.data as HoyoverseResponse;
            if (response.status !== 200 || data.retcode !== 0) {
                console.log(`[ERROR] Failed to get awards data at ${this._fullName}: ${JSON.stringify(data.message)}`);
                return { success: false };
            }

            const awardData = data.data as HoyoverseAwardData;
            if (!awardData.awards.length) {
                console.log(`[WARNING] No awards data available at ${this._fullName}`);
            }

            return { success: true, data: awardData.awards };
        } catch (error) {
            console.log(`[ERROR] Error: ${error} at ${this._fullName}`);
            return { success: false };
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
