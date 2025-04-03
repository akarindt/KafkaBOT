import { HoyoverseGameEnum } from '@enum/hoyoverse-game.enum';

export type HoyoverseHeader = Record<HoyoverseGameEnum, { [key: string]: string }>;
