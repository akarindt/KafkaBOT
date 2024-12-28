import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import schedule from 'node-schedule';
import { Utils } from './helper/util';

const log = console.log;
global.console.log = (...args) => {
    const stack = new Error().stack;
    const callerLine = stack?.split('\n')[2];
    const match = callerLine?.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);
    const fileName = match ? match[2].split('/').pop() : 'Unknown file';
    log(`[${Utils.getLocalTime()}] [${fileName}]`, ...args);
}


(async () => {
    try {
        const client = new BotClient();
        client.InitDB();
        await client.RegisterCommands();
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
