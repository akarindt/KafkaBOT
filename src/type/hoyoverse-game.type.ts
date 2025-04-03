import { HoyoverseGameEnum } from '@enum/hoyoverse-game.enum';
import { HoyoverseGameItem } from '@/interface';

export type HoyoverseGame = Record<HoyoverseGameEnum, HoyoverseGameItem>;
