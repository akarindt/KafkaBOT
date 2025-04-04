import { Database } from '@infrastructure/database.infrastructure';
import { DataSourceOptions } from 'typeorm';
import HoyoverseCode from '@entity/hoyoverse-code.entity';
import HoyoverseRedeem from '@entity/hoyoverse-redeem.entity';
import Hoyoverse from '@entity/hoyoverse.entity';
import NSFWKeyword from '@entity/nsfw-keyword.entity';
import Quote from '@entity/quote.entity';
import WuwaNotify from '@entity/wuwa-notify.entity';
import WuwaSubscribe from '@entity/wuwa-subscribe.entity';

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const defaultConfig: DataSourceOptions = {
    type: 'postgres',
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || ''),
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    entities: [HoyoverseCode, HoyoverseRedeem, Hoyoverse, NSFWKeyword, Quote, WuwaNotify, WuwaSubscribe],
    migrations: [path.resolve(__dirname, '../../migrations/*{.ts, .js}')],
    migrationsTableName: 'TBL_MIGRATION',
    synchronize: false,
    logging: false,
    extra: {
        idleTimeoutMillis: 30000,
        max: 10,
        keepAlive: true,
    },
};

export const database = new Database(defaultConfig);
export const AppDataSource = database.Source;
