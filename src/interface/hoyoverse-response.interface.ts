import { HoyoverseAwardData } from './hoyoverse-award-data.interface';
import { HoyoverseAccountData } from './hoyoverse-account-data.interface';
import { HoyoverseCheckIn } from './hoyoverse-checkin-interface';
import { HoyoverseInfoData } from './hoyoverse-infodata.interface';

export interface HoyoverseResponse {
    retcode: number;
    message: string;
    data: HoyoverseCheckIn | HoyoverseInfoData | HoyoverseAccountData | HoyoverseAwardData | null;
}
