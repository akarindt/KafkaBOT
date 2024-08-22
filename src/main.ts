import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import { database } from './helper/datasource';
import InitializeJob from './job';
import schedule from 'node-schedule';
import CloudinaryClient from './infrastructure/cloudinary';

(async () => {
    try {
        const client = new BotClient();
        database.InitializeDB();
        await client.RegisterCommands();
        await client.RegisterPlayer();
        await client.StartBot();

        // await InitializeJob(client);
    } catch (error) {
        console.log(`[ERROR] An Error Occurred: ${error}`);
    }
})();

process.on('SIGINT', async () => {
    await schedule.gracefulShutdown();
    process.exit(0);
});
