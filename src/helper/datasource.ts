import { Database } from '@/infrastructure/database';
import { DatabaseConfig } from './constant';

export const database = new Database(DatabaseConfig.DEFAULT_DB);
export const AppDataSource = database.Source;
