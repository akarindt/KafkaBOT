import { HoyoverseAccountDetail } from './hoyoverse-account-detail.interface';
import HoyoverseCode from '@entity/hoyoverse-code.entity';

export interface HoyoverseCodeRedeem {
    success: HoyoverseCode[];
    failed: HoyoverseCode[];
    account: HoyoverseAccountDetail;
    userDiscordId: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    hoyoverseId: number;
}
