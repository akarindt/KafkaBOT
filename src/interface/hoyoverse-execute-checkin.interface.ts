import { HoyoverseAccountDetail } from './hoyoverse-account-detail.interface';
export interface ExecuteCheckIn {
    userDiscordId: string;
    platform: string;
    result: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    account: HoyoverseAccountDetail;
}
