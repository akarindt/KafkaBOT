import { Database } from '@infrastructure/database.infrastructure';
import path from 'path';
import { DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const defaultConfig: DataSourceOptions = {
    type: 'postgres',
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || ''),
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    entities: [path.join(__dirname, '../entity/*{.ts, .js}')],
    migrations: [path.join(__dirname, '../../migrations/*{.ts, .js}')],
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
