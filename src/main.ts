import 'reflect-metadata';
import { BotClient } from './infrastructure/client.infrastructure';
import { AssignGlobal } from './helper/util.helper';

AssignGlobal();

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
