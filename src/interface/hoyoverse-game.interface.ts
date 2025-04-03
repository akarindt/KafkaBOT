import { HoyoverseGameEnum } from '@enum/hoyoverse-game.enum';
import { HoyoverseGameItem } from './hoyoverse-game-item.interface';

export interface HoyoverseGame extends Record<HoyoverseGameEnum, HoyoverseGameItem> {}
