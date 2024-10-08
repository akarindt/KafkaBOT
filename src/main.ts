import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import schedule from 'node-schedule';
import { Utils } from './helper/util';

const log = console.log;
global.console.log = (...args) => log(`[${Utils.getLocalTime()}]`, ...args);


(async () => {
    try {
        const client = new BotClient();
        client.InitDB();
        await client.RegisterCommands();
        await client.RegisterPlayer();
        await client.StartBot();
        await client.RegisterCronJob();
    } catch (error) {
        console.log(`[ERROR] An Error Occurred: ${error}`);
    }
})();

process.on('SIGINT', async () => {
    await schedule.gracefulShutdown();
    process.exit(0);
});
