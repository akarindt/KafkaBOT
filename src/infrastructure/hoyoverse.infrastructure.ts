import {
    HOYOVERSE_GAME_HEADERS,
    HOYOVERSE_GAME_LIST,
    HOYOVERSE_GENERAL_HEADERS,
    HOYOVERSE_RECORD_CARD_API,
    HOYOVERSE_UPDATE_COOKIE_API,
    USER_AGENT,
} from '@helper/constant.helper';
import Hoyoverse from '@entity/hoyoverse.entity';
import axios from 'axios';
import HoyoverseCode from '@entity/hoyoverse-code.entity';
import { ParseCookie } from '@helper/util.helper';
import { setTimeout } from 'timers/promises';
import { AppDataSource } from '@helper/datasource.helper';
import HoyoverseRedeem from '@entity/hoyoverse-redeem.entity';
import { In, Not } from 'typeorm';
import { HoyoverseGameEnum } from '@enum/hoyoverse-game.enum';
import { ExecuteCheckIn, HoyoverseAccountData, HoyoverseAccountDetail, HoyoverseGameItem, HoyoverseResponse } from '@/interface';

export class HoyoverseClient {
    private _name: HoyoverseGameEnum;
    private _game: HoyoverseGameItem;
    private _data: Hoyoverse[];
    private _fullName: string;
    private _userAgent: string;
    private _updateApi: string;

    constructor(name: HoyoverseGameEnum, data: Hoyoverse[]) {
        this._name = name;
        this._data = data;
        this._fullName = HOYOVERSE_GAME_LIST[this._name].gameName;
        this._game = HOYOVERSE_GAME_LIST['GENSHIN'];
        this._userAgent = USER_AGENT;
        this._updateApi = HOYOVERSE_UPDATE_COOKIE_API;

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

    async GetAccountDetails(cookie: string, ltuid: string): Promise<HoyoverseAccountDetail | null> {
        try {
            const response = await axios.get(`${HOYOVERSE_RECORD_CARD_API}?uid=${ltuid}`, {
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
                        ...HOYOVERSE_GAME_HEADERS[this._name],
                        ...HOYOVERSE_GENERAL_HEADERS,
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
        const url = this._game.url.redem;
        const accounts = this._data;
        const results = [];

        if (!url) {
            console.log(`[ERROR] Redeem code - ${this._game.gameName} doesn't have redeem function`);
            return [];
        }

        for (const account of accounts) {
            try {
                const cookie = account.cookie;

                const ltuid = cookie.match(/ltuid_v2=([^;]+)/);
                if (!ltuid) continue;

                const accountDetails = await this.GetAccountDetails(cookie, ltuid[1]);
                if (!accountDetails) continue;

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

                if (!codeList.length) continue;
                const success: HoyoverseCode[] = [];
                const failed: HoyoverseCode[] = [];

                for (const code of codeList) {
                    try {
                        const cookieData = ParseCookie(account.cookie, {
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
                }

                results.push({
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
                });
            } catch (error) {
                console.log(`[ERROR] Code redeem error: ${error}`);
                return [];
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
