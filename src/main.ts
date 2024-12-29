import 'reflect-metadata';
import { BotClient } from './infrastructure/client';
import schedule from 'node-schedule';
import { Utils } from './helper/util';

const log = console.log;
global.console.log = (...args) => {
    const stack = new Error().stack;
    const callerLine = stack?.split('\n')[2];
    const match = callerLine?.match(/at\s+(?:.*\s)?\((.*):(\d+):(\d+)\)/);
    if (match) {
        const fileName = match[1].split('/').pop();
        const lineNumber = match[2];
        const columnNumber = match[3];
        log(`[${Utils.getLocalTime()}] [${fileName}:${lineNumber}:${columnNumber}]`, ...args);
    } else {
        log(`[${Utils.getLocalTime()}] [Unknown location]`, ...args);
    }
};


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
