import { DatabaseConfig } from './helper/constant';
import { BotClient } from './infrastructure/client';
import { Database } from './infrastructure/database';

const database = new Database(DatabaseConfig.DEFAULT_DB);
const client = new BotClient();

database.InitializeDB();
client.RegisterCommands();
client.StartBot().catch((error) => console.log(error));
