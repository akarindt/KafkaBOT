import { HoyoverseGameEnum } from '@enum/hoyoverse-game.enum';

export interface HoyoverseHeader extends Record<HoyoverseGameEnum, { [key: string]: string }> {}
