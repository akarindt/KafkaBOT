import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import { database } from './helper/datasource';

(async () => {
    try {
        const client = new BotClient();
        database.InitializeDB();
        await client.RegisterCommands();
        await client.RegisterPlayer();
        await client.StartBot();
    } catch (error) {
        console.log(`[ERROR] An Error Occurred: ${error}`)
    }
})()
