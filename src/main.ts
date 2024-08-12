import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import { database } from './helper/datasource';

const client = new BotClient();
database.InitializeDB();
client.RegisterCommands();
client.RegisterPlayer();
client.StartBot().catch((error) => console.log(error));
