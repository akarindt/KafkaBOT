import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import schedule from 'node-schedule';
import { Utils } from './helper/util';

Utils.AssignGlobal();

(async () => {
    try {
        const client = new BotClient();
        client.InitDB();
        await client.RegisterCommands();
        await client.StartBot();
        // await client.RegisterCronJob();
    } catch (error) {
        console.log(`[ERROR] An Error Occurred: ${error}`);
    }
})();

process.on('SIGINT', async () => {
    await schedule.gracefulShutdown();
    process.exit(0);
});
